/* DS08 — Graph / Graph algorithms animation engine.
   Extracted from /home/phonchi/ds_slides/graphs.html (script body lines
   1111-2644) and reorganised into a single IIFE so the local helpers
   (`$`, `SVG_NS`, `GraphRenderer`, …) do not leak. Each algorithm is
   wrapped in an `init<Name>(suffix)` function with early-bail
   (`if (!canvas) return`) so the same JS can power ch8 panels with
   per-panel ID scoping.

   Each panel HTML triggers init via:
     <script>(function go(){
        if(!window.DS08||!window.DS08.init){setTimeout(go,50);return;}
        window.DS08.init.bfs();   // or .dfs, .topsort, .dijkstra, .prim
     })();</script>
*/
(function () {
  if (window.DS08) return;   // idempotent — re-running cell must not redeclare

  /* ============================================================
     COMMON UTILITIES
     ============================================================ */
  const $ = (id) => document.getElementById(id);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /**
   * GraphRenderer — one instance per canvas.
   * config = { vertices: {key: {x,y,label?}}, edges: [[u,v,w?,directed?], ...] }
   */
  class GraphRenderer {
    constructor(containerId, config, opts = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) throw new Error('GraphRenderer: missing #' + containerId);
      this.config = config;
      this.opts = Object.assign({
        directed: false,
        showWeights: true,
        nodeRadius: 22,
        width: 600,
        height: 380,
        curveOpposite: true,
      }, opts);
      this.svg = svgEl('svg', {
        viewBox: `0 0 ${this.opts.width} ${this.opts.height}`,
        preserveAspectRatio: 'xMidYMid meet',
      });
      this.container.innerHTML = '';
      this.container.appendChild(this.svg);

      const defs = svgEl('defs');
      const markerArrow = svgEl('marker', {
        id: `arrow-${containerId}`, markerWidth: '10', markerHeight: '10',
        refX: '9', refY: '3', orient: 'auto', markerUnits: 'strokeWidth',
      });
      markerArrow.appendChild(svgEl('path', { d: 'M0,0 L0,6 L9,3 z', fill: '#7f8c8d' }));
      defs.appendChild(markerArrow);
      this.svg.appendChild(defs);
      this.markerId = `arrow-${containerId}`;

      this.edgeGroup = svgEl('g', { class: 'edges' });
      this.nodeGroup = svgEl('g', { class: 'nodes' });
      this.svg.appendChild(this.edgeGroup);
      this.svg.appendChild(this.nodeGroup);

      this.nodeElems = {};
      this.edgeElems = {};
      this.render();
    }

    edgeKey(u, v) { return `${u}→${v}`; }

    render() {
      for (const e of this.config.edges) {
        const [u, v, w, dirOverride] = e;
        const directed = dirOverride !== undefined ? dirOverride : this.opts.directed;
        const u2v = this.edgeKey(u, v);
        const reverseExists = this.config.edges.some(ee => ee[0] === v && ee[1] === u);
        const a = this.config.vertices[u];
        const b = this.config.vertices[v];
        if (!a || !b) continue;
        let pathD, labelX, labelY;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist, uy = dy / dist;
        const r = this.opts.nodeRadius;
        const sx = a.x + ux * r, sy = a.y + uy * r;
        const ex = b.x - ux * r, ey = b.y - uy * r;
        let curve = 0;
        if (directed && reverseExists && this.opts.curveOpposite) curve = 18;
        if (curve !== 0) {
          const sign = -1 * Math.sign(u.localeCompare(v));
          const mx = (sx + ex) / 2 + uy * curve * sign;
          const my = (sy + ey) / 2 - ux * curve * sign;
          pathD = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
          labelX = mx + uy * 6 * sign;
          labelY = my - ux * 6 * sign;
        } else {
          pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
          labelX = (sx + ex) / 2;
          labelY = (sy + ey) / 2;
        }
        const path = svgEl('path', { d: pathD, class: 'graph-edge' });
        if (directed) path.setAttribute('marker-end', `url(#${this.markerId})`);
        this.edgeGroup.appendChild(path);

        let labelEl = null, labelBg = null;
        if (this.opts.showWeights && w !== undefined && w !== null) {
          labelBg = svgEl('rect', {
            x: labelX - 11, y: labelY - 9, width: 22, height: 18,
            rx: 3, class: 'edge-label-bg',
          });
          labelEl = svgEl('text', {
            x: labelX, y: labelY + 4, class: 'edge-label', 'text-anchor': 'middle',
          });
          labelEl.textContent = w;
          this.edgeGroup.appendChild(labelBg);
          this.edgeGroup.appendChild(labelEl);
        }
        this.edgeElems[u2v] = { path, label: labelEl, labelBg, weight: w };
      }

      for (const key in this.config.vertices) {
        const v = this.config.vertices[key];
        const g = svgEl('g', { class: 'graph-node', 'data-key': key });
        g.setAttribute('transform', `translate(${v.x},${v.y})`);
        const circle = svgEl('circle', { r: this.opts.nodeRadius });
        const text = svgEl('text', { class: 'node-key', y: 1 });
        text.textContent = v.label || key;
        const metaText = svgEl('text', { class: 'node-meta', y: this.opts.nodeRadius + 14 });
        metaText.textContent = '';
        g.appendChild(circle);
        g.appendChild(text);
        g.appendChild(metaText);
        this.nodeGroup.appendChild(g);
        this.nodeElems[key] = { group: g, circle, text, metaText };
      }
    }

    setNodeClass(key, cls) {
      if (!this.nodeElems[key]) return;
      this.nodeElems[key].group.setAttribute('class', `graph-node ${cls || ''}`.trim());
    }
    setNodeMeta(key, txt) {
      if (!this.nodeElems[key]) return;
      this.nodeElems[key].metaText.textContent = txt;
    }
    setEdgeClass(u, v, cls) {
      const key = this.edgeKey(u, v);
      if (!this.edgeElems[key]) return;
      this.edgeElems[key].path.setAttribute('class', `graph-edge ${cls || ''}`.trim());
    }
    setEdgeClassUndirected(u, v, cls) {
      this.setEdgeClass(u, v, cls);
      this.setEdgeClass(v, u, cls);
    }
    resetAll() {
      for (const k in this.nodeElems) this.setNodeClass(k, '');
      for (const k in this.nodeElems) this.setNodeMeta(k, '');
      for (const k in this.edgeElems) {
        this.edgeElems[k].path.setAttribute('class', 'graph-edge');
      }
    }
  }

  function makeUndirectedConfig(c) {
    const newEdges = [];
    for (const e of c.edges) {
      newEdges.push([e[0], e[1], e[2]]);
      newEdges.push([e[1], e[0], e[2]]);
    }
    return { vertices: c.vertices, edges: newEdges };
  }

  function buildAdjacency(config, undirected = true) {
    const adj = {};
    for (const k in config.vertices) adj[k] = [];
    for (const e of config.edges) {
      adj[e[0]].push({ to: e[1], w: e[2] });
      if (undirected) adj[e[1]].push({ to: e[0], w: e[2] });
    }
    for (const k in adj) adj[k].sort((a, b) => a.to.localeCompare(b.to));
    return adj;
  }

  function highlightCode(codeId, lineNum) {
    const root = document.getElementById(codeId);
    if (!root) return;
    root.querySelectorAll('.line').forEach(l => l.classList.remove('active'));
    if (lineNum != null) {
      const line = root.querySelector(`.line[data-l="${lineNum}"]`);
      if (line) line.classList.add('active');
    }
  }

  /* ============================================================
     PART 02 — BFS animation
     ============================================================ */
  function initBfs(suffix = '') {
    const $$ = (id) => $(id + suffix);
    const canvas = $$('canvas-bfs');
    if (!canvas) return;

    const bfsGraphConfig = {
      vertices: {
        A: { x: 100, y: 80  }, B: { x: 280, y: 60  }, C: { x: 460, y: 80 },
        D: { x: 100, y: 200 }, E: { x: 280, y: 180 }, F: { x: 460, y: 200 },
        G: { x: 200, y: 320 }, H: { x: 400, y: 320 },
      },
      edges: [
        ['A','B'], ['A','D'], ['B','C'], ['B','E'], ['C','F'],
        ['D','E'], ['D','G'], ['E','F'], ['E','G'], ['E','H'],
        ['F','H'], ['G','H'],
      ],
    };
    const bfsR = new GraphRenderer('canvas-bfs' + suffix, bfsGraphConfig, {
      directed: false, showWeights: false, width: 600, height: 380,
    });

    const codeId = 'bfsCode' + suffix;

    class BFSController {
      constructor() {
        this.steps = []; this.idx = 0; this.playing = false; this.timer = null;
      }
      generate(start) {
        const adj = buildAdjacency(bfsGraphConfig, true);
        const verts = Object.keys(bfsGraphConfig.vertices);
        const color = {}, dist = {}, prev = {};
        for (const v of verts) { color[v] = 'white'; dist[v] = Infinity; prev[v] = null; }
        color[start] = 'gray'; dist[start] = 0;
        const queue = [start];
        const steps = [];
        steps.push({ kind:'init', codeLine:6, queue:[...queue], current:null, msg:`初始化：將起點 ${start} 設為 gray、distance=0、加入 queue`,
          color:{...color}, dist:{...dist}, prev:{...prev} });
        while (queue.length > 0) {
          const u = queue.shift();
          steps.push({ kind:'dequeue', codeLine:8, current:u, queue:[...queue], msg:`從 queue 取出 ${u}（distance = ${dist[u]}），開始檢查鄰居`,
            color:{...color}, dist:{...dist}, prev:{...prev} });
          for (const { to: w } of adj[u]) {
            if (color[w] === 'white') {
              color[w] = 'gray'; dist[w] = dist[u] + 1; prev[w] = u;
              queue.push(w);
              steps.push({ kind:'discover', codeLine:11, current:u, neighbor:w, queue:[...queue], msg:`發現新頂點 ${w}：標 gray、distance=${dist[w]}、previous=${u}、加入 queue`,
                color:{...color}, dist:{...dist}, prev:{...prev}, treeEdge:[u,w] });
            } else {
              steps.push({ kind:'skip', codeLine:10, current:u, neighbor:w, queue:[...queue], msg:`鄰居 ${w} 已是 ${color[w]}（已被發現過），跳過`,
                color:{...color}, dist:{...dist}, prev:{...prev} });
            }
          }
          color[u] = 'black';
          steps.push({ kind:'finish', codeLine:15, current:u, queue:[...queue], msg:`${u} 的所有鄰居都檢查完畢，標為 black`,
            color:{...color}, dist:{...dist}, prev:{...prev} });
        }
        steps.push({ kind:'done', codeLine:null, current:null, queue:[], msg:`BFS 完成！從 ${start} 出發已探索所有可達頂點。`,
          color:{...color}, dist:{...dist}, prev:{...prev} });
        this.steps = steps; this.idx = 0; this.start = start;
      }
      applyStep(s) {
        bfsR.resetAll();
        for (const k in s.color) bfsR.setNodeClass(k, s.color[k] === 'white' ? '' : s.color[k]);
        if (s.current && s.kind !== 'finish') bfsR.setNodeClass(s.current, 'current');
        if (s.kind === 'init') bfsR.setNodeClass(this.start, 'start');
        for (const k in s.dist) bfsR.setNodeMeta(k, isFinite(s.dist[k]) ? `d=${s.dist[k]}` : '');
        for (const k in s.prev) {
          if (s.prev[k]) bfsR.setEdgeClassUndirected(s.prev[k], k, 'tree');
        }
        if (s.kind === 'discover' && s.treeEdge) bfsR.setEdgeClassUndirected(s.treeEdge[0], s.treeEdge[1], 'exploring');
        else if (s.kind === 'skip' && s.current && s.neighbor) bfsR.setEdgeClassUndirected(s.current, s.neighbor, 'dotted');
        const qEl = $$('bfsQueue');
        if (qEl) {
          if (s.queue.length === 0) qEl.innerHTML = '<span class="ds-empty">empty</span>';
          else qEl.innerHTML = s.queue.map((v, i) =>
            `<span class="ds-item ${i === 0 ? 'front' : ''}">${v}</span>` +
            (i < s.queue.length - 1 ? '<span class="ds-arrow">←</span>' : '')
          ).join('');
        }
        const stEl = $$('bfsStatus'); if (stEl) stEl.innerHTML = s.msg;
        highlightCode(codeId, s.codeLine);
        let visited = 0;
        for (const k in s.color) if (s.color[k] !== 'white') visited++;
        const vEl = $$('bfsVisited'); if (vEl) vEl.textContent = visited;
        const dEl = $$('bfsDist'); if (dEl) dEl.textContent = s.current ? (isFinite(s.dist[s.current]) ? s.dist[s.current] : '—') : '—';
        this.updateTable(s);
      }
      updateTable(s) {
        const tEl = $$('bfsTable'); if (!tEl) return;
        const verts = Object.keys(bfsGraphConfig.vertices);
        let html = '<table class="vert-table"><thead><tr><th>v</th><th>color</th><th>d</th><th>prev</th></tr></thead><tbody>';
        for (const v of verts) {
          const cls = (s.current === v) ? 'tcell-current' : (s.color[v] === 'black' ? 'tcell-done' : '');
          const d = isFinite(s.dist[v]) ? s.dist[v] : '<span class="tcell-inf">∞</span>';
          html += `<tr><td class="${cls}">${v}</td><td class="${cls}">${s.color[v]}</td><td class="${cls}">${d}</td><td class="${cls}">${s.prev[v] || '—'}</td></tr>`;
        }
        html += '</tbody></table>';
        tEl.innerHTML = html;
      }
      reset() {
        this.stop();
        bfsR.resetAll();
        this.steps = []; this.idx = 0;
        const stEl = $$('bfsStatus'); if (stEl) stEl.textContent = '選擇起點，按「開始」執行 BFS';
        const qEl = $$('bfsQueue'); if (qEl) qEl.innerHTML = '<span class="ds-empty">empty</span>';
        const vEl = $$('bfsVisited'); if (vEl) vEl.textContent = '0';
        const dEl = $$('bfsDist'); if (dEl) dEl.textContent = '—';
        const tEl = $$('bfsTable'); if (tEl) tEl.innerHTML = '';
        highlightCode(codeId, null);
      }
      step() {
        if (this.steps.length === 0) this.generate($$('bfsStart').value);
        if (this.idx >= this.steps.length) return false;
        this.applyStep(this.steps[this.idx]); this.idx++;
        return this.idx < this.steps.length;
      }
      play() {
        if (this.playing) return this.stop();
        if (this.steps.length === 0) this.generate($$('bfsStart').value);
        this.playing = true;
        const btn = $$('bfsPlay');
        if (btn) { btn.classList.add('active'); btn.textContent = '⏸ 暫停'; }
        const tick = () => {
          if (!this.playing) return;
          if (!this.step()) { this.stop(); return; }
          this.timer = setTimeout(tick, parseInt($$('bfsSpeed').value));
        };
        tick();
      }
      stop() {
        this.playing = false;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        const btn = $$('bfsPlay');
        if (btn) { btn.classList.remove('active'); btn.textContent = '▶ 開始'; }
      }
    }
    const ctrl = new BFSController();
    const playB = $$('bfsPlay'); if (playB) playB.addEventListener('click', () => ctrl.play());
    const stepB = $$('bfsStep'); if (stepB) stepB.addEventListener('click', () => { ctrl.stop(); ctrl.step(); });
    const resB  = $$('bfsReset'); if (resB)  resB.addEventListener('click', () => ctrl.reset());
    const sel   = $$('bfsStart'); if (sel)   sel.addEventListener('change', () => ctrl.reset());
    ctrl.reset();
    // initial table render so a fresh panel still shows the vertex grid
    const verts0 = Object.keys(bfsGraphConfig.vertices);
    ctrl.updateTable({ current:null, color:Object.fromEntries(verts0.map(v=>[v,'white'])),
                       dist:Object.fromEntries(verts0.map(v=>[v,Infinity])),
                       prev:Object.fromEntries(verts0.map(v=>[v,null])) });
  }

  /* ============================================================
     PART 04 — DFS animation
     ============================================================ */
  function initDfs(suffix = '') {
    const $$ = (id) => $(id + suffix);
    const canvas = $$('canvas-dfs');
    if (!canvas) return;

    const dfsGraphConfig = {
      vertices: {
        A: { x: 100, y: 90  },
        B: { x: 280, y: 60  },
        C: { x: 460, y: 90  },
        D: { x: 100, y: 280 },
        E: { x: 280, y: 230 },
        F: { x: 460, y: 280 },
      },
      edges: [
        ['A','B'], ['B','C'], ['A','D'], ['B','D'],
        ['D','E'], ['E','B'], ['E','F'], ['F','C'],
      ],
    };
    const dfsR = new GraphRenderer('canvas-dfs' + suffix, dfsGraphConfig, {
      directed: true, showWeights: false, width: 600, height: 380,
    });
    const codeId = 'dfsCode' + suffix;

    class DFSController {
      constructor() { this.steps = []; this.idx = 0; this.playing = false; this.timer = null; }
      generate(startKey) {
        const verts = Object.keys(dfsGraphConfig.vertices);
        const order = [startKey, ...verts.filter(v => v !== startKey)];
        const adj = buildAdjacency(dfsGraphConfig, false);
        const color = {}, prev = {}, disc = {}, close = {};
        for (const v of verts) { color[v] = 'white'; prev[v] = null; disc[v] = 0; close[v] = 0; }
        let time = 0;
        const stack = [];
        const steps = [];
        steps.push({ kind:'init', codeLine:2, current:null, stack:[], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:'初始化所有頂點為 white' });

        const visit = (u) => {
          color[u] = 'gray'; time += 1; disc[u] = time;
          stack.push(u);
          steps.push({ kind:'visit', codeLine:9, current:u, stack:[...stack], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:`發現 ${u}：標 gray，discovery = ${time}` });
          const sortedNb = [...adj[u]].sort((a,b) => a.to.localeCompare(b.to));
          for (const { to: w } of sortedNb) {
            if (color[w] === 'white') {
              prev[w] = u;
              steps.push({ kind:'recurse', codeLine:13, current:u, neighbor:w, stack:[...stack], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, treeEdge:[u,w], msg:`從 ${u} 遞迴進入 ${w}` });
              visit(w);
            } else {
              steps.push({ kind:'skip', codeLine:12, current:u, neighbor:w, stack:[...stack], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:`鄰居 ${w} 已是 ${color[w]}（虛線邊），跳過` });
            }
          }
          color[u] = 'black'; time += 1; close[u] = time;
          stack.pop();
          steps.push({ kind:'finish', codeLine:16, current:u, stack:[...stack], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:`${u} 完成探索：標 black，closing = ${time}（從 stack 彈出）` });
        };

        for (const v of order) {
          if (color[v] === 'white') {
            steps.push({ kind:'newroot', codeLine:6, current:v, stack:[...stack], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:`啟動新的 DFS tree（root = ${v}）` });
            visit(v);
          }
        }
        steps.push({ kind:'done', codeLine:null, current:null, stack:[], color:{...color}, prev:{...prev}, disc:{...disc}, close:{...close}, time, msg:`DFS forest 完成。Total time = ${time}` });
        this.steps = steps; this.idx = 0; this.start = startKey;
      }
      applyStep(s) {
        dfsR.resetAll();
        for (const k in s.color) dfsR.setNodeClass(k, s.color[k] === 'white' ? '' : s.color[k]);
        if (s.current && s.kind !== 'finish' && s.kind !== 'done') dfsR.setNodeClass(s.current, 'current');
        if (s.kind === 'init') dfsR.setNodeClass(this.start, 'start');
        for (const k in s.prev) {
          if (s.prev[k]) dfsR.setEdgeClass(s.prev[k], k, 'tree');
        }
        if (s.kind === 'recurse' && s.treeEdge) dfsR.setEdgeClass(s.treeEdge[0], s.treeEdge[1], 'exploring');
        if (s.kind === 'skip' && s.current && s.neighbor) dfsR.setEdgeClass(s.current, s.neighbor, 'dotted');
        for (const k in s.disc) {
          const d = s.disc[k], c = s.close[k];
          if (d > 0 && c > 0) dfsR.setNodeMeta(k, `${d}/${c}`);
          else if (d > 0) dfsR.setNodeMeta(k, `${d}/—`);
          else dfsR.setNodeMeta(k, '');
        }
        const stEl = $$('dfsStack');
        if (stEl) {
          if (s.stack.length === 0) stEl.innerHTML = '<span class="ds-empty">empty</span>';
          else stEl.innerHTML = s.stack.map((v,i,arr) => `<span class="ds-item ${i===arr.length-1?'top':''}">${v}</span>`).join(' ');
        }
        const tEl = $$('dfsTime'); if (tEl) tEl.textContent = s.time;
        const sb = $$('dfsStatus'); if (sb) sb.innerHTML = s.msg;
        highlightCode(codeId, s.codeLine);
        this.updateTable(s);
      }
      updateTable(s) {
        const tEl = $$('dfsTable'); if (!tEl) return;
        const verts = Object.keys(dfsGraphConfig.vertices);
        let html = '<table class="vert-table"><thead><tr><th>v</th><th>color</th><th>disc</th><th>close</th><th>prev</th></tr></thead><tbody>';
        for (const v of verts) {
          const cls = (s.current === v) ? 'tcell-current' : (s.color[v] === 'black' ? 'tcell-done' : '');
          html += `<tr><td class="${cls}">${v}</td><td class="${cls}">${s.color[v]}</td><td class="${cls}">${s.disc[v] || '—'}</td><td class="${cls}">${s.close[v] || '—'}</td><td class="${cls}">${s.prev[v] || '—'}</td></tr>`;
        }
        html += '</tbody></table>';
        tEl.innerHTML = html;
      }
      reset() {
        this.stop();
        dfsR.resetAll();
        this.steps = []; this.idx = 0;
        const sb = $$('dfsStatus'); if (sb) sb.textContent = '按「開始」跑完整 DFS（會走遍整個 forest）';
        const stEl = $$('dfsStack'); if (stEl) stEl.innerHTML = '<span class="ds-empty">empty</span>';
        const tEl = $$('dfsTime'); if (tEl) tEl.textContent = '0';
        const ttEl = $$('dfsTable'); if (ttEl) ttEl.innerHTML = '';
        highlightCode(codeId, null);
      }
      step() {
        if (this.steps.length === 0) this.generate($$('dfsStart').value);
        if (this.idx >= this.steps.length) return false;
        this.applyStep(this.steps[this.idx]); this.idx++;
        return this.idx < this.steps.length;
      }
      play() {
        if (this.playing) return this.stop();
        if (this.steps.length === 0) this.generate($$('dfsStart').value);
        this.playing = true;
        const btn = $$('dfsPlay'); if (btn) { btn.classList.add('active'); btn.textContent = '⏸ 暫停'; }
        const tick = () => {
          if (!this.playing) return;
          if (!this.step()) { this.stop(); return; }
          this.timer = setTimeout(tick, parseInt($$('dfsSpeed').value));
        };
        tick();
      }
      stop() {
        this.playing = false;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        const btn = $$('dfsPlay'); if (btn) { btn.classList.remove('active'); btn.textContent = '▶ 開始'; }
      }
    }
    const ctrl = new DFSController();
    const pb = $$('dfsPlay'); if (pb) pb.addEventListener('click', () => ctrl.play());
    const sb = $$('dfsStep'); if (sb) sb.addEventListener('click', () => { ctrl.stop(); ctrl.step(); });
    const rb = $$('dfsReset'); if (rb) rb.addEventListener('click', () => ctrl.reset());
    const sel = $$('dfsStart'); if (sel) sel.addEventListener('change', () => ctrl.reset());
    ctrl.reset();
    const verts0 = Object.keys(dfsGraphConfig.vertices);
    ctrl.updateTable({ current:null, color:Object.fromEntries(verts0.map(v=>[v,'white'])),
                       disc:Object.fromEntries(verts0.map(v=>[v,0])),
                       close:Object.fromEntries(verts0.map(v=>[v,0])),
                       prev:Object.fromEntries(verts0.map(v=>[v,null])) });
  }

  /* ============================================================
     NEW: Topological Sort animation
     Algorithm = DFS on a DAG, append on exit (post-order),
     then reverse to obtain a topological order.
     ============================================================ */
  function initTopSort(suffix = '') {
    const $$ = (id) => $(id + suffix);
    const canvas = $$('canvas-topsort');
    if (!canvas) return;

    // Small DAG (course-prerequisite style)
    const topsortGraphConfig = {
      vertices: {
        A: { x: 80,  y: 70  },
        B: { x: 240, y: 70  },
        C: { x: 400, y: 70  },
        D: { x: 160, y: 200 },
        E: { x: 320, y: 200 },
        F: { x: 240, y: 320 },
      },
      edges: [
        ['A','D'], ['B','D'], ['B','E'], ['C','E'],
        ['D','F'], ['E','F'],
      ],
    };
    const tsR = new GraphRenderer('canvas-topsort' + suffix, topsortGraphConfig, {
      directed: true, showWeights: false, width: 600, height: 380,
    });
    const codeId = 'topCode' + suffix;

    class TopSortController {
      constructor() { this.steps = []; this.idx = 0; this.playing = false; this.timer = null; }
      generate() {
        const verts = Object.keys(topsortGraphConfig.vertices);
        const adj = buildAdjacency(topsortGraphConfig, false);
        const color = {}, finishOrder = [];
        for (const v of verts) color[v] = 'white';
        const stack = [];
        const steps = [];
        steps.push({ kind:'init', codeLine:2, current:null, stack:[], color:{...color}, finished:[...finishOrder], msg:'初始化 result = []，所有頂點為 white' });

        const visit = (u) => {
          color[u] = 'gray';
          stack.push(u);
          steps.push({ kind:'visit', codeLine:5, current:u, stack:[...stack], color:{...color}, finished:[...finishOrder], msg:`進入 dfs(${u})：標 gray、push 到 stack` });
          const sortedNb = [...adj[u]].sort((a,b) => a.to.localeCompare(b.to));
          for (const { to: w } of sortedNb) {
            if (color[w] === 'white') {
              steps.push({ kind:'recurse', codeLine:7, current:u, neighbor:w, stack:[...stack], color:{...color}, finished:[...finishOrder], treeEdge:[u,w], msg:`鄰居 ${w} 仍 white，遞迴進入 dfs(${w})` });
              visit(w);
            } else {
              steps.push({ kind:'skip', codeLine:6, current:u, neighbor:w, stack:[...stack], color:{...color}, finished:[...finishOrder], msg:`鄰居 ${w} 已是 ${color[w]}（在 stack 中或已結束），跳過` });
            }
          }
          color[u] = 'black';
          finishOrder.push(u);
          stack.pop();
          steps.push({ kind:'finish', codeLine:8, current:u, stack:[...stack], color:{...color}, finished:[...finishOrder], msg:`${u} 鄰居走完：標 black，append 到 result（result = [${finishOrder.join(', ')}]）` });
        };

        for (const v of verts) {
          if (color[v] === 'white') {
            steps.push({ kind:'newroot', codeLine:11, current:v, stack:[...stack], color:{...color}, finished:[...finishOrder], msg:`外層迴圈：${v} 仍 white → 啟動 dfs(${v})` });
            visit(v);
          }
        }
        const topOrder = [...finishOrder].reverse();
        steps.push({ kind:'reverse', codeLine:13, current:null, stack:[], color:{...color}, finished:[...finishOrder], topOrder, msg:`所有 DFS 結束。將 result 反轉得到拓撲順序：${topOrder.join(' → ')}` });
        this.steps = steps; this.idx = 0;
      }
      applyStep(s) {
        tsR.resetAll();
        for (const k in s.color) tsR.setNodeClass(k, s.color[k] === 'white' ? '' : (s.color[k] === 'black' ? 'done' : 'gray'));
        if (s.current && s.kind !== 'finish' && s.kind !== 'reverse') tsR.setNodeClass(s.current, 'current');
        if (s.kind === 'recurse' && s.treeEdge) tsR.setEdgeClass(s.treeEdge[0], s.treeEdge[1], 'exploring');
        if (s.kind === 'skip' && s.current && s.neighbor) tsR.setEdgeClass(s.current, s.neighbor, 'dotted');
        // finish-time labels: meta = position in finishOrder
        s.finished.forEach((v, i) => tsR.setNodeMeta(v, `f=${i + 1}`));
        // stack
        const stEl = $$('topStack');
        if (stEl) {
          if (s.stack.length === 0) stEl.innerHTML = '<span class="ds-empty">empty</span>';
          else stEl.innerHTML = s.stack.map((v,i,arr) => `<span class="ds-item ${i===arr.length-1?'top':''}">${v}</span>`).join(' ');
        }
        // result strip — finish-order list
        const rEl = $$('topResult');
        if (rEl) {
          if (s.finished.length === 0) rEl.innerHTML = '<span class="ts-label">result</span><span style="color:rgba(255,255,255,.4)">（尚無結束的頂點）</span>';
          else rEl.innerHTML =
            '<span class="ts-label">result</span>' +
            s.finished.map((v, i) => `<span class="ts-vert">${v}</span>` + (i < s.finished.length-1 ? '<span class="ts-arrow">,</span>' : '')).join('');
        }
        // topological order (only at the final reverse step)
        const oEl = $$('topOrder');
        if (oEl) {
          if (s.topOrder) {
            oEl.innerHTML = '<span class="ts-label">topo</span>' +
              s.topOrder.map((v, i) => `<span class="ts-vert">${v}</span>` + (i < s.topOrder.length-1 ? '<span class="ts-arrow">→</span>' : '')).join('');
          } else {
            oEl.innerHTML = '<span class="ts-label">topo</span><span style="color:rgba(255,255,255,.4)">（DFS 結束後反轉 result）</span>';
          }
        }
        const sb = $$('topStatus'); if (sb) sb.innerHTML = s.msg;
        highlightCode(codeId, s.codeLine);
      }
      reset() {
        this.stop();
        tsR.resetAll();
        this.steps = []; this.idx = 0;
        const sb = $$('topStatus'); if (sb) sb.textContent = '按「開始」執行 DFS-based 拓撲排序';
        const stEl = $$('topStack'); if (stEl) stEl.innerHTML = '<span class="ds-empty">empty</span>';
        const rEl = $$('topResult'); if (rEl) rEl.innerHTML = '<span class="ts-label">result</span><span style="color:rgba(255,255,255,.4)">（尚無結束的頂點）</span>';
        const oEl = $$('topOrder'); if (oEl) oEl.innerHTML = '<span class="ts-label">topo</span><span style="color:rgba(255,255,255,.4)">（DFS 結束後反轉 result）</span>';
        highlightCode(codeId, null);
      }
      step() {
        if (this.steps.length === 0) this.generate();
        if (this.idx >= this.steps.length) return false;
        this.applyStep(this.steps[this.idx]); this.idx++;
        return this.idx < this.steps.length;
      }
      play() {
        if (this.playing) return this.stop();
        if (this.steps.length === 0) this.generate();
        this.playing = true;
        const btn = $$('topPlay'); if (btn) { btn.classList.add('active'); btn.textContent = '⏸ 暫停'; }
        const tick = () => {
          if (!this.playing) return;
          if (!this.step()) { this.stop(); return; }
          this.timer = setTimeout(tick, parseInt($$('topSpeed').value));
        };
        tick();
      }
      stop() {
        this.playing = false;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        const btn = $$('topPlay'); if (btn) { btn.classList.remove('active'); btn.textContent = '▶ 開始'; }
      }
    }
    const ctrl = new TopSortController();
    const pb = $$('topPlay'); if (pb) pb.addEventListener('click', () => ctrl.play());
    const sb = $$('topStep'); if (sb) sb.addEventListener('click', () => { ctrl.stop(); ctrl.step(); });
    const rb = $$('topReset'); if (rb) rb.addEventListener('click', () => ctrl.reset());
    ctrl.reset();
  }

  /* ============================================================
     PART 06 — Dijkstra animation
     ============================================================ */
  function initDijkstra(suffix = '') {
    const $$ = (id) => $(id + suffix);
    const canvas = $$('canvas-dijkstra');
    if (!canvas) return;

    const dijGraphConfig = {
      vertices: {
        u: { x: 100, y: 90  },
        v: { x: 300, y: 60  },
        w: { x: 500, y: 90  },
        x: { x: 200, y: 230 },
        y: { x: 400, y: 230 },
        z: { x: 550, y: 290 },
      },
      edges: [
        ['u','v',2], ['v','w',3], ['w','z',5],
        ['u','x',1], ['u','w',5], ['x','v',2],
        ['x','w',3], ['x','y',1], ['y','w',1], ['y','z',1],
      ],
    };
    const dijR = new GraphRenderer('canvas-dijkstra' + suffix, dijGraphConfig, {
      directed: false, showWeights: true, width: 600, height: 380,
    });
    const codeId = 'dijCode' + suffix;

    class DijkstraController {
      constructor() { this.steps = []; this.idx = 0; this.playing = false; this.timer = null; }
      generate(start) {
        const verts = Object.keys(dijGraphConfig.vertices);
        const adj = buildAdjacency(dijGraphConfig, true);
        const dist = {}, prev = {}, visited = {};
        for (const v of verts) { dist[v] = Infinity; prev[v] = null; visited[v] = false; }
        dist[start] = 0;
        let pq = verts.map(v => [dist[v], v]);
        const sortPq = () => pq.sort((a,b) => a[0] - b[0]);
        const steps = [];
        sortPq();
        steps.push({ kind:'init', codeLine:4, current:null, pq:[...pq], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`初始化：start=${start}, distance=0；其他全部 ∞`, treeEdges: [] });

        while (pq.length > 0) {
          sortPq();
          const [d, u] = pq.shift();
          if (d === Infinity) break;
          if (visited[u]) continue;
          visited[u] = true;
          const treeEdges = verts.filter(vv => prev[vv]).map(vv => [prev[vv], vv]);
          steps.push({ kind:'pop', codeLine:7, current:u, pq:[...pq], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`從 PQ 取出最小：${u} (distance = ${d})，標記為 visited`, treeEdges });
          for (const { to: vv, w: weight } of adj[u]) {
            if (visited[vv]) {
              steps.push({ kind:'skip', codeLine:10, current:u, neighbor:vv, pq:[...pq], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`鄰居 ${vv} 已 visited，跳過`, treeEdges });
              continue;
            }
            const newD = d + weight;
            steps.push({ kind:'relax-check', codeLine:11, current:u, neighbor:vv, edge:[u,vv], pq:[...pq], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`鬆弛邊 ${u}—${vv}：new_d = ${d} + ${weight} = ${newD}，目前 d(${vv}) = ${isFinite(dist[vv]) ? dist[vv] : '∞'}`, treeEdges });
            if (newD < dist[vv]) {
              dist[vv] = newD; prev[vv] = u;
              pq = pq.filter(p => p[1] !== vv);
              pq.push([newD, vv]);
              sortPq();
              steps.push({ kind:'relax-update', codeLine:13, current:u, neighbor:vv, pq:[...pq], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`更新！d(${vv}) = ${newD}，previous(${vv}) = ${u}`, treeEdges: [...treeEdges.filter(e => e[1] !== vv), [u, vv]] });
            }
          }
        }
        const treeEdges = verts.filter(vv => prev[vv]).map(vv => [prev[vv], vv]);
        steps.push({ kind:'done', codeLine:null, current:null, pq:[], dist:{...dist}, prev:{...prev}, visited:{...visited}, msg:`Dijkstra 完成。最短路徑樹已建立。`, treeEdges });
        this.steps = steps; this.idx = 0; this.start = start;
      }
      applyStep(s) {
        dijR.resetAll();
        const verts = Object.keys(dijGraphConfig.vertices);
        for (const v of verts) {
          if (s.visited[v]) dijR.setNodeClass(v, 'black');
          else if (isFinite(s.dist[v])) dijR.setNodeClass(v, 'gray');
          else dijR.setNodeClass(v, '');
        }
        if (s.current && s.kind !== 'done') dijR.setNodeClass(s.current, 'current');
        if (this.start && s.kind === 'init') dijR.setNodeClass(this.start, 'start');
        for (const v of verts) {
          const d = s.dist[v];
          dijR.setNodeMeta(v, isFinite(d) ? `d=${d}` : '∞');
        }
        for (const [u, vv] of s.treeEdges || []) dijR.setEdgeClassUndirected(u, vv, 'tree');
        if (s.kind === 'relax-check' && s.edge) dijR.setEdgeClassUndirected(s.edge[0], s.edge[1], 'exploring');
        if (s.kind === 'skip' && s.current && s.neighbor) dijR.setEdgeClassUndirected(s.current, s.neighbor, 'dotted');
        const pqEl = $$('dijPQ');
        if (pqEl) {
          const visiblePq = (s.pq || []).filter(p => isFinite(p[0]));
          if (visiblePq.length === 0) pqEl.innerHTML = '<span class="ds-empty">empty</span>';
          else pqEl.innerHTML = visiblePq.map((p,i) => `<span class="ds-item pq ${i===0?'min':''}">${p[1]}:${p[0]}</span>`).join(' ');
        }
        const sb = $$('dijStatus'); if (sb) sb.innerHTML = s.msg;
        highlightCode(codeId, s.codeLine);
        this.updateTable(s);
      }
      updateTable(s) {
        const tEl = $$('dijTable'); if (!tEl) return;
        const verts = Object.keys(dijGraphConfig.vertices);
        let html = '<table class="vert-table"><thead><tr><th>v</th><th>distance</th><th>prev</th><th>visited</th></tr></thead><tbody>';
        for (const v of verts) {
          const cls = (s.current === v) ? 'tcell-current' : (s.visited[v] ? 'tcell-done' : '');
          const d = isFinite(s.dist[v]) ? s.dist[v] : '<span class="tcell-inf">∞</span>';
          html += `<tr><td class="${cls}">${v}</td><td class="${cls}">${d}</td><td class="${cls}">${s.prev[v] || '—'}</td><td class="${cls}">${s.visited[v] ? '✓' : ''}</td></tr>`;
        }
        html += '</tbody></table>';
        tEl.innerHTML = html;
      }
      reset() {
        this.stop();
        dijR.resetAll();
        this.steps = []; this.idx = 0;
        const sb = $$('dijStatus'); if (sb) sb.textContent = '選擇起點，按「開始」執行 Dijkstra';
        const pq = $$('dijPQ'); if (pq) pq.innerHTML = '<span class="ds-empty">empty</span>';
        const t = $$('dijTable'); if (t) t.innerHTML = '';
        highlightCode(codeId, null);
      }
      step() {
        if (this.steps.length === 0) this.generate($$('dijStart').value);
        if (this.idx >= this.steps.length) return false;
        this.applyStep(this.steps[this.idx]); this.idx++;
        return this.idx < this.steps.length;
      }
      play() {
        if (this.playing) return this.stop();
        if (this.steps.length === 0) this.generate($$('dijStart').value);
        this.playing = true;
        const btn = $$('dijPlay'); if (btn) { btn.classList.add('active'); btn.textContent = '⏸ 暫停'; }
        const tick = () => {
          if (!this.playing) return;
          if (!this.step()) { this.stop(); return; }
          this.timer = setTimeout(tick, parseInt($$('dijSpeed').value));
        };
        tick();
      }
      stop() {
        this.playing = false;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        const btn = $$('dijPlay'); if (btn) { btn.classList.remove('active'); btn.textContent = '▶ 開始'; }
      }
    }
    const ctrl = new DijkstraController();
    const pb = $$('dijPlay'); if (pb) pb.addEventListener('click', () => ctrl.play());
    const sb = $$('dijStep'); if (sb) sb.addEventListener('click', () => { ctrl.stop(); ctrl.step(); });
    const rb = $$('dijReset'); if (rb) rb.addEventListener('click', () => ctrl.reset());
    const sel = $$('dijStart'); if (sel) sel.addEventListener('change', () => ctrl.reset());
    ctrl.reset();
    const verts0 = Object.keys(dijGraphConfig.vertices);
    ctrl.updateTable({ current:null,
                       dist:Object.fromEntries(verts0.map(v=>[v,Infinity])),
                       prev:Object.fromEntries(verts0.map(v=>[v,null])),
                       visited:Object.fromEntries(verts0.map(v=>[v,false])) });
  }

  /* ============================================================
     PART 07 — Prim animation
     ============================================================ */
  function initPrim(suffix = '') {
    const $$ = (id) => $(id + suffix);
    const canvas = $$('canvas-prim');
    if (!canvas) return;

    const primGraphConfig = {
      vertices: {
        A: { x: 100, y: 80  },
        B: { x: 270, y: 60  },
        C: { x: 440, y: 80  },
        D: { x: 100, y: 280 },
        E: { x: 270, y: 260 },
        F: { x: 440, y: 280 },
        G: { x: 560, y: 180 },
      },
      edges: [
        ['A','B',2], ['A','C',3], ['B','C',1], ['B','D',1],
        ['B','E',4], ['D','E',1], ['C','F',5], ['E','F',1], ['F','G',1],
      ],
    };
    const primR = new GraphRenderer('canvas-prim' + suffix, primGraphConfig, {
      directed: false, showWeights: true, width: 600, height: 380,
    });
    const codeId = 'primCode' + suffix;

    class PrimController {
      constructor() { this.steps = []; this.idx = 0; this.playing = false; this.timer = null; }
      generate(start) {
        const verts = Object.keys(primGraphConfig.vertices);
        const adj = buildAdjacency(primGraphConfig, true);
        const dist = {}, prev = {}, inTree = {};
        for (const v of verts) { dist[v] = Infinity; prev[v] = null; inTree[v] = false; }
        dist[start] = 0;
        let pq = verts.map(v => [dist[v], v]);
        const sortPq = () => pq.sort((a,b) => a[0] - b[0]);
        const steps = [];
        const mstEdges = [];
        let total = 0;
        sortPq();
        steps.push({ kind:'init', codeLine:5, current:null, pq:[...pq], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`初始化：起點 ${start} distance=0；其他全部 ∞` });

        while (pq.length > 0) {
          sortPq();
          const [d, u] = pq.shift();
          if (d === Infinity) break;
          if (inTree[u]) continue;
          inTree[u] = true;
          if (prev[u]) {
            mstEdges.push([prev[u], u, d]);
            total += d;
          }
          steps.push({ kind:'add', codeLine:8, current:u, pq:[...pq], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`從 PQ 取出 ${u} (key=${d})，加入 MST。${prev[u] ? `加入邊 ${prev[u]}—${u} (weight=${d})` : '（起點，無邊加入）'}` });

          for (const { to: vv, w: weight } of adj[u]) {
            if (inTree[vv]) {
              steps.push({ kind:'skip', codeLine:11, current:u, neighbor:vv, pq:[...pq], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`鄰居 ${vv} 已在 MST 中，跳過` });
              continue;
            }
            const newD = weight;
            steps.push({ kind:'relax-check', codeLine:10, current:u, neighbor:vv, edge:[u,vv], pq:[...pq], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`檢查 ${u}—${vv}：邊權 = ${weight}，目前 key(${vv}) = ${isFinite(dist[vv]) ? dist[vv] : '∞'}` });
            if (newD < dist[vv]) {
              dist[vv] = newD; prev[vv] = u;
              pq = pq.filter(p => p[1] !== vv);
              pq.push([newD, vv]);
              sortPq();
              steps.push({ kind:'relax-update', codeLine:13, current:u, neighbor:vv, pq:[...pq], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`更新！key(${vv}) = ${newD}，previous(${vv}) = ${u}` });
            }
          }
        }
        steps.push({ kind:'done', codeLine:null, current:null, pq:[], dist:{...dist}, prev:{...prev}, inTree:{...inTree}, mstEdges:[...mstEdges], total, msg:`Prim 完成。MST 共 ${mstEdges.length} 條邊，總權重 = ${total}` });
        this.steps = steps; this.idx = 0; this.start = start;
      }
      applyStep(s) {
        primR.resetAll();
        const verts = Object.keys(primGraphConfig.vertices);
        for (const v of verts) {
          if (s.inTree[v]) primR.setNodeClass(v, 'in-mst');
          else if (isFinite(s.dist[v])) primR.setNodeClass(v, 'gray');
          else primR.setNodeClass(v, '');
        }
        if (s.current && s.kind !== 'done') primR.setNodeClass(s.current, 'current');
        if (s.kind === 'init') primR.setNodeClass(this.start, 'start');
        for (const v of verts) {
          primR.setNodeMeta(v, isFinite(s.dist[v]) ? `${s.dist[v]}` : '∞');
        }
        for (const [u, vv] of s.mstEdges || []) primR.setEdgeClassUndirected(u, vv, 'mst');
        if (s.kind === 'relax-check' && s.edge) primR.setEdgeClassUndirected(s.edge[0], s.edge[1], 'exploring');
        if (s.kind === 'skip' && s.current && s.neighbor) primR.setEdgeClassUndirected(s.current, s.neighbor, 'dotted');
        const pqEl = $$('primPQ');
        if (pqEl) {
          const visiblePq = (s.pq || []).filter(p => isFinite(p[0]));
          if (visiblePq.length === 0) pqEl.innerHTML = '<span class="ds-empty">empty</span>';
          else pqEl.innerHTML = visiblePq.map((p,i) => `<span class="ds-item pq ${i===0?'min':''}">${p[1]}:${p[0]}</span>`).join(' ');
        }
        const eEl = $$('primEdges');
        if (eEl) {
          if (s.mstEdges.length === 0) eEl.innerHTML = '<span style="color:var(--muted);">—</span>';
          else eEl.innerHTML = s.mstEdges.map(([u,vv,w]) => `<span class="ds-item" style="background:var(--accent3);margin:1px;">${u}—${vv}<span style="opacity:.7">/${w}</span></span>`).join(' ');
        }
        const itEl = $$('primInTree'); if (itEl) itEl.textContent = `${Object.values(s.inTree).filter(x=>x).length}/${verts.length}`;
        const tEl = $$('primTotal'); if (tEl) tEl.textContent = s.total;
        const sb = $$('primStatus'); if (sb) sb.innerHTML = s.msg;
        highlightCode(codeId, s.codeLine);
      }
      reset() {
        this.stop();
        primR.resetAll();
        this.steps = []; this.idx = 0;
        const sb = $$('primStatus'); if (sb) sb.textContent = '選擇起點，按「開始」逐步建立 MST';
        const pq = $$('primPQ'); if (pq) pq.innerHTML = '<span class="ds-empty">empty</span>';
        const e  = $$('primEdges'); if (e)  e.innerHTML = '—';
        const i  = $$('primInTree'); if (i)  i.textContent = '0/0';
        const t  = $$('primTotal'); if (t)  t.textContent = '0';
        highlightCode(codeId, null);
      }
      step() {
        if (this.steps.length === 0) this.generate($$('primStart').value);
        if (this.idx >= this.steps.length) return false;
        this.applyStep(this.steps[this.idx]); this.idx++;
        return this.idx < this.steps.length;
      }
      play() {
        if (this.playing) return this.stop();
        if (this.steps.length === 0) this.generate($$('primStart').value);
        this.playing = true;
        const btn = $$('primPlay'); if (btn) { btn.classList.add('active'); btn.textContent = '⏸ 暫停'; }
        const tick = () => {
          if (!this.playing) return;
          if (!this.step()) { this.stop(); return; }
          this.timer = setTimeout(tick, parseInt($$('primSpeed').value));
        };
        tick();
      }
      stop() {
        this.playing = false;
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
        const btn = $$('primPlay'); if (btn) { btn.classList.remove('active'); btn.textContent = '▶ 開始'; }
      }
    }
    const ctrl = new PrimController();
    const pb = $$('primPlay'); if (pb) pb.addEventListener('click', () => ctrl.play());
    const sb = $$('primStep'); if (sb) sb.addEventListener('click', () => { ctrl.stop(); ctrl.step(); });
    const rb = $$('primReset'); if (rb) rb.addEventListener('click', () => ctrl.reset());
    const sel = $$('primStart'); if (sel) sel.addEventListener('change', () => ctrl.reset());
    ctrl.reset();
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  const _initialized = new Set();
  const _once = (name, fn) => () => {
    if (_initialized.has(name)) return;
    _initialized.add(name);
    return fn();
  };

  window.DS08 = {
    init: {
      bfs:      _once('bfs',      () => initBfs('Bfs')),
      dfs:      _once('dfs',      () => initDfs('Dfs')),
      topsort:  _once('topsort',  () => initTopSort('Top')),
      dijkstra: _once('dijkstra', () => initDijkstra('Dij')),
      prim:     _once('prim',     () => initPrim('Prim')),
    },
  };
})();
