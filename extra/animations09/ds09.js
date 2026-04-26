/* DS09 — Tree / Heap / BST animation engine.
   Extracted from trees.html lines 1107-2833 (utilities, Player class, and
   the 4 panel init functions used by chapter 9: traversals, heap, bst,
   bst-delete). Wrapped in an IIFE so the local `$` helper does not shadow
   jQuery, and exposed via `window.DS09.init.*` for caller-driven start.

   Each panel HTML triggers init via:
     <script>(function go(){
        if(!window.DS09||!window.DS09.init){setTimeout(go,50);return;}
        window.DS09.init.preorder();   // or .inorder, .postorder, .heapInsert, ...
     })();</script>
*/
(function () {
  if (window.DS09) return;   // idempotent — re-running cell 6 must not redeclare

/* ============================================================
   COMMON UTILITIES
   ============================================================ */
const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';

/* Tree node data structure for visualizations */
class TNode {
  constructor(key) {
    this.key = key;
    this.left = null;
    this.right = null;
    this.parent = null;
    this.x = 0; this.y = 0;  // computed layout coords (relative to canvas)
    this.id = TNode._id++;
  }
}
TNode._id = 0;

/* Compute (x, y) layout for a tree using a simple level-by-level
   horizontal split. Returns the depth. */
function layoutTree(root, w, h, topPad=40, botPad=40) {
  if (!root) return 0;
  let depth = 0;
  function getDepth(n, d) {
    if (!n) return;
    depth = Math.max(depth, d);
    getDepth(n.left, d+1);
    getDepth(n.right, d+1);
  }
  getDepth(root, 0);
  const dy = depth === 0 ? 0 : (h - topPad - botPad) / depth;
  function place(n, d, lo, hi) {
    if (!n) return;
    n.x = (lo + hi) / 2;
    n.y = topPad + d * dy;
    const mid = n.x;
    place(n.left,  d+1, lo, mid);
    place(n.right, d+1, mid, hi);
  }
  place(root, 0, 0, w);
  return depth;
}

/* Iterate all nodes (preorder) */
function* allNodes(root) {
  if (!root) return;
  yield root;
  yield* allNodes(root.left);
  yield* allNodes(root.right);
}

function nodeCount(root) {
  let n = 0;
  for (const _ of allNodes(root)) n++;
  return n;
}

function treeHeight(root) {
  if (!root) return -1;
  return 1 + Math.max(treeHeight(root.left), treeHeight(root.right));
}

/* Render tree to a canvas: creates DOM nodes for each TNode and
   SVG <line> for each edge. Positions are read from .x / .y. */
function renderTree(canvas, root, opts={}) {
  const nodesLayer = canvas.querySelector('.nodes-layer');
  const svg = canvas.querySelector('svg');
  // Clear
  nodesLayer.innerHTML = '';
  svg.innerHTML = '';
  if (!root) return;

  // Edges first (so they sit under nodes)
  function drawEdges(n) {
    if (!n) return;
    if (n.left) {
      const ln = document.createElementNS(SVG_NS, 'line');
      ln.setAttribute('x1', n.x); ln.setAttribute('y1', n.y);
      ln.setAttribute('x2', n.left.x); ln.setAttribute('y2', n.left.y);
      ln.setAttribute('class', 't-edge edge-' + n.id + '-' + n.left.id);
      ln.dataset.from = n.id; ln.dataset.to = n.left.id;
      svg.appendChild(ln);
      drawEdges(n.left);
    }
    if (n.right) {
      const ln = document.createElementNS(SVG_NS, 'line');
      ln.setAttribute('x1', n.x); ln.setAttribute('y1', n.y);
      ln.setAttribute('x2', n.right.x); ln.setAttribute('y2', n.right.y);
      ln.setAttribute('class', 't-edge edge-' + n.id + '-' + n.right.id);
      ln.dataset.from = n.id; ln.dataset.to = n.right.id;
      svg.appendChild(ln);
      drawEdges(n.right);
    }
  }
  drawEdges(root);

  // Nodes
  for (const n of allNodes(root)) {
    const div = document.createElement('div');
    div.className = 't-node node-' + n.id;
    div.dataset.id = n.id;
    div.style.left = n.x + 'px';
    div.style.top = n.y + 'px';
    div.textContent = n.key;
    if (opts.onClick) div.addEventListener('click', () => opts.onClick(n));
    if (opts.onHover) {
      div.addEventListener('mouseenter', () => opts.onHover(n));
      div.addEventListener('mouseleave', () => opts.onHover(null));
    }
    nodesLayer.appendChild(div);
  }
}

/* Update edges when nodes have moved (animation between layouts) */
function updateEdges(canvas, root) {
  const svg = canvas.querySelector('svg');
  if (!root) { svg.innerHTML = ''; return; }
  // Remove existing
  svg.innerHTML = '';
  function drawEdges(n) {
    if (!n) return;
    for (const child of [n.left, n.right]) {
      if (!child) continue;
      const ln = document.createElementNS(SVG_NS, 'line');
      ln.setAttribute('x1', n.x); ln.setAttribute('y1', n.y);
      ln.setAttribute('x2', child.x); ln.setAttribute('y2', child.y);
      ln.setAttribute('class', 't-edge edge-' + n.id + '-' + child.id);
      ln.dataset.from = n.id; ln.dataset.to = child.id;
      svg.appendChild(ln);
      drawEdges(child);
    }
  }
  drawEdges(root);
}

/* Highlight nodes / edges by id list */
function clearHL(canvas) {
  canvas.querySelectorAll('.t-node').forEach(el =>
    el.classList.remove('active', 'visited', 'target', 'current', 'parent-hl', 'path', 'subtree', 'faded', 'leaf-ind', 'deleted'));
  canvas.querySelectorAll('.t-edge').forEach(el =>
    el.classList.remove('active', 'visited', 'path', 'subtree', 'faded'));
}

function setNodeClass(canvas, id, cls, on=true) {
  const el = canvas.querySelector('.node-' + id);
  if (el) el.classList.toggle(cls, on);
}

function setEdgeClass(canvas, fromId, toId, cls, on=true) {
  const el = canvas.querySelector('.edge-' + fromId + '-' + toId);
  if (el) el.classList.toggle(cls, on);
}

/* Build tree from preorder array (use null for empty). Helper. */
function buildFromArr(arr, idx={i:0}) {
  if (idx.i >= arr.length || arr[idx.i] === null) {
    idx.i++;
    return null;
  }
  const n = new TNode(arr[idx.i++]);
  n.left = buildFromArr(arr, idx);
  if (n.left) n.left.parent = n;
  n.right = buildFromArr(arr, idx);
  if (n.right) n.right.parent = n;
  return n;
}

/* Highlight pseudo-code line */
function hlLine(codeEl, lineNum) {
  if (!codeEl) return;
  codeEl.querySelectorAll('.line').forEach(el => el.classList.remove('active'));
  if (lineNum != null) {
    const el = codeEl.querySelector(`.line[data-l="${lineNum}"]`);
    if (el) el.classList.add('active');
  }
}

/* Generic step-based animation player */
class Player {
  constructor(opts) {
    this.steps = opts.steps;          // array of step objects
    this.apply = opts.apply;          // (step, idx) => void
    this.delay = opts.delay || 700;
    this.idx = 0;
    this.timer = null;
    this.onEnd = opts.onEnd;
    this.onIdxChange = opts.onIdxChange;
  }
  reset(steps) {
    this.stop();
    if (steps) this.steps = steps;
    this.idx = 0;
    if (this.steps.length) this.apply(this.steps[0], 0);
    if (this.onIdxChange) this.onIdxChange(this.idx);
  }
  step() {
    if (this.idx + 1 >= this.steps.length) { this.stop(); return false; }
    this.idx++;
    this.apply(this.steps[this.idx], this.idx);
    if (this.onIdxChange) this.onIdxChange(this.idx);
    return true;
  }
  play() {
    if (this.timer) return;
    const tick = () => {
      if (!this.step()) {
        this.timer = null;
        if (this.onEnd) this.onEnd();
        return;
      }
      this.timer = setTimeout(tick, this.delay);
    };
    this.timer = setTimeout(tick, this.delay);
  }
  stop() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
  setDelay(d) { this.delay = d; }
}

/* ============================================================
   PART 01 — VOCABULARY (Interactive Tree)
   ============================================================ */
function initVocabulary() {
  const canvas = $('canvas-vocab');
  if (!canvas) return;
  // Sample tree (Mammalia style)
  // Use same tree as PDF: root with several layers
  const root = buildFromArr(['A',
    'B', 'D', null, null, 'E', 'H', null, null, null,
    'C', 'F', null, null, 'G', null, null
  ]);

  function render() {
    layoutTree(root, canvas.clientWidth, canvas.clientHeight, 35, 35);
    renderTree(canvas, root, {
      onClick: (n) => clickNode(n),
      onHover: (n) => hoverNode(n),
    });
  }

  // Compute properties for a node
  function nodeProps(n) {
    let level = 0;
    for (let p = n.parent; p; p = p.parent) level++;
    function h(x) { return x ? 1 + Math.max(h(x.left), h(x.right)) : -1; }
    let children = [];
    if (n.left) children.push(n.left.key);
    if (n.right) children.push(n.right.key);
    let siblings = [];
    if (n.parent) {
      if (n.parent.left && n.parent.left !== n) siblings.push(n.parent.left.key);
      if (n.parent.right && n.parent.right !== n) siblings.push(n.parent.right.key);
    }
    return {
      key: n.key,
      parent: n.parent ? n.parent.key : '(root)',
      children: children.length ? children.join(', ') : '(leaf)',
      siblings: siblings.length ? siblings.join(', ') : '—',
      level: level,
      height: h(n),
      isLeaf: !n.left && !n.right,
    };
  }

  function hoverNode(n) {
    if (!n) {
      $('vocabKey').textContent = '—';
      $('vocabParent').textContent = '—';
      $('vocabChildren').textContent = '—';
      $('vocabSibs').textContent = '—';
      $('vocabLevel').textContent = '—';
      $('vocabHeight').textContent = '—';
      $('vocabLeaf').textContent = '—';
      return;
    }
    const p = nodeProps(n);
    $('vocabKey').textContent = p.key;
    $('vocabParent').textContent = p.parent;
    $('vocabChildren').textContent = p.children;
    $('vocabSibs').textContent = p.siblings;
    $('vocabLevel').textContent = p.level;
    $('vocabHeight').textContent = p.height;
    $('vocabLeaf').textContent = p.isLeaf ? '✓ yes' : '✗ no';
  }

  function clickNode(n) {
    clearHL(canvas);
    // Highlight subtree
    function markSub(x) {
      if (!x) return;
      setNodeClass(canvas, x.id, 'subtree');
      if (x.left) { setEdgeClass(canvas, x.id, x.left.id, 'subtree'); markSub(x.left); }
      if (x.right) { setEdgeClass(canvas, x.id, x.right.id, 'subtree'); markSub(x.right); }
    }
    markSub(n);
    // Highlight path-to-root
    let cur = n;
    while (cur.parent) {
      setEdgeClass(canvas, cur.parent.id, cur.id, 'path');
      setNodeClass(canvas, cur.parent.id, 'path');
      cur = cur.parent;
    }
    // Current node
    setNodeClass(canvas, n.id, 'current');
    const p = nodeProps(n);
    $('vocabStatus').textContent =
      `${p.key}: level=${p.level}, height=${p.height}, ${p.isLeaf ? '葉節點' : 'children=[' + p.children + ']'}`;
  }

  $('vocabReset').onclick = () => {
    clearHL(canvas);
    $('vocabStatus').textContent = '將滑鼠移到節點上看屬性，點擊節點高亮路徑與子樹';
  };

  render();
  return { resize: render };
}

/* ============================================================
   PART 02 — NODES & REFERENCES (build tree step-by-step)
   ============================================================ */
function initNodesRefs() {
  const canvas = $('canvas-nr');
  if (!canvas) return;

  // Build steps: each step describes the tree state and which line is active
  function buildSteps() {
    const steps = [];
    // Step 0: just root 'a'
    let s0 = { tree: () => {
      const r = new TNode('a');
      return r;
    }, line: 1, msg: 'a_tree = BinaryTree("a")：建立根節點' };
    steps.push(s0);

    let s1 = { tree: () => {
      const r = new TNode('a');
      r.left = new TNode('b'); r.left.parent = r;
      return r;
    }, line: 2, msg: 'insert_left("b")：建立左子並掛上' };
    steps.push(s1);

    let s2 = { tree: () => {
      const r = new TNode('a');
      r.left = new TNode('b'); r.left.parent = r;
      r.right = new TNode('c'); r.right.parent = r;
      return r;
    }, line: 3, msg: 'insert_right("c")：建立右子並掛上' };
    steps.push(s2);

    let s3 = { tree: () => {
      const r = new TNode('a');
      r.left = new TNode('b'); r.left.parent = r;
      r.left.right = new TNode('d'); r.left.right.parent = r.left;
      r.right = new TNode('c'); r.right.parent = r;
      return r;
    }, line: 4, msg: 'b 的右邊掛上 d', highlight: 'd' };
    steps.push(s3);

    let s4 = { tree: () => {
      const r = new TNode('a');
      r.left = new TNode('b'); r.left.parent = r;
      r.left.right = new TNode('d'); r.left.right.parent = r.left;
      r.right = new TNode('c'); r.right.parent = r;
      r.right.left = new TNode('e'); r.right.left.parent = r.right;
      return r;
    }, line: 5, msg: 'c 的左邊掛上 e', highlight: 'e' };
    steps.push(s4);

    let s5 = { tree: () => {
      const r = new TNode('a');
      r.left = new TNode('b'); r.left.parent = r;
      r.left.right = new TNode('d'); r.left.right.parent = r.left;
      r.right = new TNode('c'); r.right.parent = r;
      r.right.left = new TNode('e'); r.right.left.parent = r.right;
      r.right.right = new TNode('f'); r.right.right.parent = r.right;
      return r;
    }, line: 6, msg: 'c 的右邊掛上 f — 完成', highlight: 'f' };
    steps.push(s5);
    return steps;
  }

  const steps = buildSteps();
  let stepIdx = 0;
  let timer = null;

  function applyStep(i) {
    const s = steps[i];
    const root = s.tree();
    layoutTree(root, canvas.clientWidth, canvas.clientHeight, 35, 35);
    renderTree(canvas, root);
    if (s.highlight) {
      // find node with that key and mark
      for (const n of allNodes(root)) {
        if (n.key === s.highlight) {
          setNodeClass(canvas, n.id, 'target');
        }
      }
    }
    hlLine($('nrCode'), s.line);
    $('nrStatus').textContent = `Step ${i+1}/${steps.length}: ${s.msg}`;
  }

  function reset() {
    if (timer) { clearTimeout(timer); timer = null; }
    $('nrPlay').classList.remove('active');
    $('nrPlay').textContent = '▶ 自動播放';
    stepIdx = 0;
    applyStep(0);
  }

  $('nrStep').onclick = () => {
    if (stepIdx + 1 < steps.length) {
      stepIdx++;
      applyStep(stepIdx);
    }
  };

  $('nrReset').onclick = reset;

  $('nrPlay').onclick = () => {
    if (timer) {
      clearTimeout(timer); timer = null;
      $('nrPlay').classList.remove('active');
      $('nrPlay').textContent = '▶ 自動播放';
      return;
    }
    if (stepIdx + 1 >= steps.length) reset();
    $('nrPlay').classList.add('active');
    $('nrPlay').textContent = '⏸ 暫停';
    function tick() {
      if (stepIdx + 1 < steps.length) {
        stepIdx++;
        applyStep(stepIdx);
        timer = setTimeout(tick, 900);
      } else {
        timer = null;
        $('nrPlay').classList.remove('active');
        $('nrPlay').textContent = '▶ 自動播放';
      }
    }
    timer = setTimeout(tick, 900);
  };

  reset();
  return { resize: () => applyStep(stepIdx) };
}

/* ============================================================
   PART 03 — PARSE TREE (build + evaluate)
   ============================================================ */
function initParseTree() {
  const canvas = $('canvas-parse');
  if (!canvas) return;

  let currentTokens = [];
  let player = null;

  function tokenize(expr) {
    return expr.trim().split(/\s+/).filter(t => t.length);
  }

  function genBuildSteps(tokens) {
    /* Simulate the build_parse_tree algorithm and emit a
       step for each token + intermediate state. */
    const steps = [];
    // We'll keep root as a TNode tree. Each node has a 'cur' marker.
    const root = new TNode('');
    let cur = root;
    const stk = [root];
    let nodeCounter = 0;
    function snapshot(activeIdx, msg, highlightCur=true, finished=false, evalRes=null) {
      // Deep copy tree structure with node ids preserved by serialization
      // Simpler: each step keeps a reference to the same root (since we mutate);
      // but for animation we need a "frame": serialize keys per id.
      const frame = { activeIdx, msg, finished, evalRes };
      // Snapshot: for each node id, record key
      frame.keys = new Map();
      frame.parents = new Map();
      frame.struct = serializeTree(root);
      frame.cur = cur ? cur.id : null;
      frame.stk = stk.map(n => n.id);
      steps.push(frame);
    }
    snapshot(-1, '初始化：空根節點，stack=[root]');

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === '(') {
        // insert_left then descend
        cur.left = new TNode(''); cur.left.parent = cur;
        stk.push(cur);
        cur = cur.left;
        snapshot(i, `'(': 新增 left child，下移；push parent (stack 深度=${stk.length})`);
      } else if (['+','-','*','/'].includes(t)) {
        cur.key = t;
        cur.right = new TNode(''); cur.right.parent = cur;
        stk.push(cur);
        cur = cur.right;
        snapshot(i, `'${t}': 設 root，新增 right child，下移；push parent`);
      } else if (/^-?\d+$/.test(t)) {
        cur.key = parseInt(t, 10);
        const parent = stk.pop();
        cur = parent;
        snapshot(i, `'${t}': 設葉節點為數字，pop 回 parent`);
      } else if (t === ')') {
        cur = stk.pop();
        snapshot(i, `')': pop 回 parent`);
      }
    }
    snapshot(tokens.length, '建構完成', true, true);
    // Compute evaluation
    function evalT(n) {
      if (n.left && n.right) {
        const a = evalT(n.left), b = evalT(n.right);
        switch(n.key) {
          case '+': return a+b;
          case '-': return a-b;
          case '*': return a*b;
          case '/': return a/b;
        }
      }
      return n.key;
    }
    let evalResult = '—';
    try { evalResult = evalT(root); } catch(e) {}
    steps[steps.length-1].evalRes = evalResult;
    return { steps, root };
  }

  function serializeTree(root) {
    // Returns array of {id, key, left, right} representing the tree
    const nodes = [];
    function visit(n) {
      if (!n) return null;
      nodes.push({
        id: n.id,
        key: n.key,
        leftId: n.left ? n.left.id : null,
        rightId: n.right ? n.right.id : null,
      });
      visit(n.left); visit(n.right);
    }
    visit(root);
    return { rootId: root ? root.id : null, nodes };
  }

  function applyFrame(frame) {
    // Reconstruct tree from struct
    const struct = frame.struct;
    if (!struct) return;
    const map = new Map();
    for (const nd of struct.nodes) {
      const n = new TNode(nd.key === '' ? '?' : nd.key);
      n.id = nd.id;  // preserve id
      map.set(nd.id, n);
    }
    for (const nd of struct.nodes) {
      const n = map.get(nd.id);
      if (nd.leftId != null) { n.left = map.get(nd.leftId); n.left.parent = n; }
      if (nd.rightId != null) { n.right = map.get(nd.rightId); n.right.parent = n; }
    }
    const root = map.get(struct.rootId);
    layoutTree(root, canvas.clientWidth, canvas.clientHeight, 35, 35);
    renderTree(canvas, root);

    // Highlight cur
    if (frame.cur != null) setNodeClass(canvas, frame.cur, 'current');

    // Update side panel
    $('parseTok').textContent = frame.activeIdx >= 0 && frame.activeIdx < currentTokens.length ?
      currentTokens[frame.activeIdx] : '—';
    $('parseCur').textContent = (frame.cur != null) ? (map.get(frame.cur).key || '?') : '—';
    $('parseStackD').textContent = frame.stk.length;
    $('parseResult').textContent = frame.finished ? frame.evalRes : '—';

    // Tokens strip
    const tokEl = $('parseTokens');
    tokEl.innerHTML = '';
    currentTokens.forEach((t, i) => {
      const sp = document.createElement('span');
      sp.className = 'token' + (i === frame.activeIdx ? ' active' : '') +
                     (i < frame.activeIdx ? ' done' : '');
      sp.textContent = t;
      tokEl.appendChild(sp);
    });

    // Stack
    const stkEl = $('parseStack');
    stkEl.innerHTML = '<div class="stack-label">parent ↓</div>';
    frame.stk.forEach((id, i) => {
      const fr = document.createElement('div');
      fr.className = 'stack-frame' + (i === frame.stk.length - 1 ? ' top' : '');
      const node = map.get(id);
      fr.textContent = `[${i}] ${node ? (node.key === '?' ? '_' : node.key) : '_'}`;
      stkEl.appendChild(fr);
    });

    $('parseStatus').textContent = frame.msg;
  }

  function regen() {
    const expr = $('parseInput').value;
    currentTokens = tokenize(expr);
    const { steps } = genBuildSteps(currentTokens);
    if (player) player.stop();
    player = new Player({
      steps,
      apply: (frame) => applyFrame(frame),
      delay: parseInt($('parseSpeed').value, 10),
    });
    player.reset();
  }

  $('parseApply').onclick = regen;
  $('parseInput').addEventListener('change', regen);
  document.querySelectorAll('#parse-tree .preset-btn[data-expr]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#parse-tree .preset-btn[data-expr]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('parseInput').value = btn.dataset.expr;
      regen();
    };
  });
  $('parsePlay').onclick = () => { if (player) player.play(); };
  $('parseStep').onclick = () => { if (player) player.step(); };
  $('parseReset').onclick = () => { if (player) player.reset(); };
  $('parseSpeed').addEventListener('input', () => {
    if (player) player.setDelay(parseInt($('parseSpeed').value, 10));
  });
  $('parseEvalBtn').onclick = () => {
    // jump to last step
    if (player) {
      player.stop();
      while (player.step()) {}
    }
  };

  regen();
  return { resize: regen };
}

/* ============================================================
   PART 04 — TREE TRAVERSALS
   ============================================================ */
function initTraversals(suffix = '', lockedKind = null) {
  const $$ = (id) => document.getElementById(id + suffix);
  const canvas = $$('canvas-trav');
  if (!canvas) return;
  const panelRoot = canvas.closest('.ds09-anim');

  // Three sample trees
  const trees = {
    parse: () => {
      // (3 + (4 * 5))
      const r = new TNode('+');
      r.left = new TNode(3); r.left.parent = r;
      r.right = new TNode('*'); r.right.parent = r;
      r.right.left = new TNode(4); r.right.left.parent = r.right;
      r.right.right = new TNode(5); r.right.right.parent = r.right;
      return r;
    },
    bst: () => {
      const r = new TNode(50);
      r.left = new TNode(30); r.left.parent = r;
      r.right = new TNode(70); r.right.parent = r;
      r.left.left = new TNode(20); r.left.left.parent = r.left;
      r.left.right = new TNode(40); r.left.right.parent = r.left;
      r.right.right = new TNode(80); r.right.right.parent = r.right;
      return r;
    },
    balanced: () => {
      const arr = ['F','B','A',null,null,'D','C',null,null,'E',null,null,'G',null,'H',null,null];
      return buildFromArr(arr);
    }
  };

  let currentTree = trees.parse();
  let currentTrav = lockedKind || 'preorder';
  let player = null;

  function genTraversalSteps(root, kind) {
    const steps = [];
    const callStack = [];
    const output = [];
    function visit(n, depth) {
      if (!n) return;
      callStack.push(n.key);
      steps.push({ active: n.id, callStack: [...callStack], output: [...output], phase: 'enter', msg: `進入 ${n.key}（深度 ${depth}）` });
      if (kind === 'preorder') {
        output.push(n.key);
        steps.push({ active: n.id, callStack: [...callStack], output: [...output], phase: 'visit', msg: `visit ${n.key}` });
      }
      visit(n.left, depth+1);
      if (kind === 'inorder') {
        output.push(n.key);
        steps.push({ active: n.id, callStack: [...callStack], output: [...output], phase: 'visit', msg: `visit ${n.key}` });
      }
      visit(n.right, depth+1);
      if (kind === 'postorder') {
        output.push(n.key);
        steps.push({ active: n.id, callStack: [...callStack], output: [...output], phase: 'visit', msg: `visit ${n.key}` });
      }
      callStack.pop();
      steps.push({ active: n.id, callStack: [...callStack], output: [...output], phase: 'exit', visited: true, msg: `離開 ${n.key}` });
    }
    visit(root, 0);
    steps.push({ active: null, callStack: [], output: [...output], phase: 'done', msg: `${kind} 完成` });
    return steps;
  }

  function applyFrame(frame) {
    // Clear
    canvas.querySelectorAll('.t-node').forEach(el => el.classList.remove('active','visited','target'));
    // Mark visited (any node whose key already in output)
    const outputSet = new Set(frame.output);
    for (const n of allNodes(currentTree)) {
      if (outputSet.has(n.key)) setNodeClass(canvas, n.id, 'visited');
    }
    if (frame.active != null) {
      setNodeClass(canvas, frame.active, frame.phase === 'visit' ? 'target' : 'active');
    }
    // Output strip
    const out = $$('travOutput');
    if (frame.output.length === 0) {
      out.innerHTML = '<span style="color:rgba(255,255,255,.4)">尚未訪問任何節點</span>';
    } else {
      out.innerHTML = frame.output.map(k => `<span class="out-key">${k}</span>`).join('');
    }
    // Stack
    const stkEl = $$('travStack');
    stkEl.innerHTML = '<div class="stack-label">call stack ↓</div>';
    frame.callStack.forEach((k, i) => {
      const fr = document.createElement('div');
      fr.className = 'stack-frame' + (i === frame.callStack.length - 1 ? ' top' : '');
      fr.textContent = `${currentTrav}(${k})`;
      stkEl.appendChild(fr);
    });
    $$('travStatus').textContent = frame.msg;
  }

  function regen() {
    layoutTree(currentTree, canvas.clientWidth, canvas.clientHeight, 35, 35);
    renderTree(canvas, currentTree);
    const steps = genTraversalSteps(currentTree, currentTrav);
    if (player) player.stop();
    player = new Player({
      steps,
      apply: applyFrame,
      delay: parseInt($$('travSpeed').value, 10),
    });
    player.reset();
    // Update code panel to match traversal
    const codeMap = {
      preorder: `<span class="line" data-l="1"><span class="kw">def</span> <span class="fn">preorder</span>(tree):</span>
<span class="line" data-l="2">    <span class="kw">if</span> tree:</span>
<span class="line" data-l="3">        <span class="fn">visit</span>(tree.key)   <span class="com"># root</span></span>
<span class="line" data-l="4">        <span class="fn">preorder</span>(tree.left)</span>
<span class="line" data-l="5">        <span class="fn">preorder</span>(tree.right)</span>`,
      inorder: `<span class="line" data-l="1"><span class="kw">def</span> <span class="fn">inorder</span>(tree):</span>
<span class="line" data-l="2">    <span class="kw">if</span> tree:</span>
<span class="line" data-l="3">        <span class="fn">inorder</span>(tree.left)</span>
<span class="line" data-l="4">        <span class="fn">visit</span>(tree.key)   <span class="com"># root</span></span>
<span class="line" data-l="5">        <span class="fn">inorder</span>(tree.right)</span>`,
      postorder: `<span class="line" data-l="1"><span class="kw">def</span> <span class="fn">postorder</span>(tree):</span>
<span class="line" data-l="2">    <span class="kw">if</span> tree:</span>
<span class="line" data-l="3">        <span class="fn">postorder</span>(tree.left)</span>
<span class="line" data-l="4">        <span class="fn">postorder</span>(tree.right)</span>
<span class="line" data-l="5">        <span class="fn">visit</span>(tree.key)   <span class="com"># root</span></span>`,
    };
    $$('travCode').innerHTML = codeMap[currentTrav];
  }

  if (lockedKind) {
    // Hide the traversal-kind preset row (kind is locked by panel choice)
    panelRoot.querySelectorAll('.preset-btn[data-trav]').forEach(b => {
      b.classList.toggle('active', b.dataset.trav === lockedKind);
      const row = b.closest('.preset-row');
      if (row) row.style.display = 'none';
    });
  } else {
    panelRoot.querySelectorAll('.preset-btn[data-trav]').forEach(btn => {
      btn.onclick = () => {
        panelRoot.querySelectorAll('.preset-btn[data-trav]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTrav = btn.dataset.trav;
        regen();
      };
    });
  }
  panelRoot.querySelectorAll('.preset-btn[data-tree]').forEach(btn => {
    btn.onclick = () => {
      panelRoot.querySelectorAll('.preset-btn[data-tree]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTree = trees[btn.dataset.tree]();
      regen();
    };
  });
  $$('travPlay').onclick = () => { if (player) player.play(); };
  $$('travStep').onclick = () => { if (player) player.step(); };
  $$('travReset').onclick = () => { if (player) player.reset(); };
  $$('travSpeed').addEventListener('input', () => {
    if (player) player.setDelay(parseInt($$('travSpeed').value, 10));
  });

  regen();
  return { resize: regen };
}

/* ============================================================
   PART 05 — BINARY HEAP
   ============================================================ */
function initHeap(suffix = '', lockedOp = null) {
  const $$ = (id) => document.getElementById(id + suffix);
  const canvas = $$('canvas-heap');
  if (!canvas) return;
  const panelRoot = canvas.closest('.ds09-anim');
  const listEl = $$('heapList');

  // Map external lockedOp names ('insert' | 'extract' | 'build') onto
  // the internal data-op identifiers used in the original markup.
  const opMap = { insert: 'insert', extract: 'delete', build: 'heapify' };
  const initialOp = lockedOp ? (opMap[lockedOp] || lockedOp) : 'insert';

  let heapArr = [3, 5, 9, 7, 11, 15, 14];
  let currentOp = initialOp;
  let player = null;
  let stats = { swap: 0, cmp: 0 };

  // Build a TNode tree from heap array (parallel structure for visualization)
  function arrToTree(arr) {
    if (arr.length === 0) return null;
    const nodes = arr.map(k => new TNode(k));
    for (let i = 0; i < arr.length; i++) {
      const li = 2*i + 1, ri = 2*i + 2;
      if (li < arr.length) { nodes[i].left = nodes[li]; nodes[li].parent = nodes[i]; }
      if (ri < arr.length) { nodes[i].right = nodes[ri]; nodes[ri].parent = nodes[i]; }
    }
    return nodes[0];
  }

  function renderHeapBoth(arr, hl) {
    hl = hl || {};
    const root = arrToTree(arr);
    const w = canvas.clientWidth || 600;
    const h = parseInt(canvas.style.height) || 280;
    if (root) {
      layoutTree(root, w, h, 36, 36);
      renderTree(canvas, root);
      // Apply highlights based on array index
      const allTNodes = [];
      (function walk(n){ if(!n) return; allTNodes.push(n); walk(n.left); walk(n.right); })(root);
      // The order in allTNodes is preorder, but our nodes were created in array order
      // Re-grab by index using the original index of creation
      arr.forEach((_, i) => {
        const el = canvas.querySelectorAll('.t-node')[i];
        if (!el) return;
        if (hl.active === i) el.classList.add('active');
        if (hl.parent === i) el.classList.add('parent-hl');
        if (hl.swap && hl.swap.includes(i)) el.classList.add('current');
      });
    } else {
      renderTree(canvas, null);
    }

    // Render array list
    listEl.innerHTML = '';
    arr.forEach((k, i) => {
      const cell = document.createElement('div');
      cell.className = 'heap-cell';
      cell.innerHTML = `<span class="cell-idx">${i}</span>${k}`;
      if (hl.active === i) cell.classList.add('active');
      if (hl.parent === i) cell.classList.add('parent');
      if (hl.swap && hl.swap.includes(i)) cell.classList.add('swap');
      listEl.appendChild(cell);
    });
  }

  // Re-render relying on creation order: rebuild the tree so nodes-layer order matches array index
  function renderHeap(arr, hl) {
    hl = hl || {};
    TNode._id = 0;
    const root = arrToTree(arr);
    const w = canvas.clientWidth || 600;
    const h = parseInt(canvas.style.height) || 280;
    if (root) layoutTree(root, w, h, 36, 36);

    const nodesLayer = canvas.querySelector('.nodes-layer');
    const svg = canvas.querySelector('svg');
    nodesLayer.innerHTML = '';
    svg.innerHTML = '';

    // Build node DOMs in array order
    const nodeEls = [];
    arr.forEach((k, i) => {
      const div = document.createElement('div');
      div.className = 't-node';
      div.style.left = '0px';
      div.style.top = '0px';
      div.textContent = k;
      nodeEls.push(div);
      nodesLayer.appendChild(div);
    });
    // Now position by walking tree (mapping order: BFS = array order)
    if (root) {
      // Use BFS to map index -> tnode
      const q = [root]; const tnodes = [];
      while (q.length) { const n = q.shift(); tnodes.push(n); if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
      tnodes.forEach((n, i) => {
        nodeEls[i].style.left = n.x + 'px';
        nodeEls[i].style.top = n.y + 'px';
      });
      // Edges
      tnodes.forEach((n, i) => {
        const li = 2*i+1, ri = 2*i+2;
        for (const ci of [li, ri]) {
          if (ci >= tnodes.length) continue;
          const child = tnodes[ci];
          const ln = document.createElementNS(SVG_NS, 'line');
          ln.setAttribute('x1', n.x); ln.setAttribute('y1', n.y);
          ln.setAttribute('x2', child.x); ln.setAttribute('y2', child.y);
          ln.setAttribute('class', 't-edge');
          if (hl.activeEdge && hl.activeEdge[0]===i && hl.activeEdge[1]===ci) ln.classList.add('active');
          svg.appendChild(ln);
        }
      });
    }

    // Highlights
    arr.forEach((_, i) => {
      const el = nodeEls[i]; if (!el) return;
      if (hl.active === i) el.classList.add('active');
      if (hl.parent === i) el.classList.add('parent-hl');
      if (hl.swap && hl.swap.includes(i)) el.classList.add('current');
      if (hl.fixed && hl.fixed.includes(i)) el.classList.add('visited');
    });

    listEl.innerHTML = '';
    arr.forEach((k, i) => {
      const cell = document.createElement('div');
      cell.className = 'heap-cell';
      cell.innerHTML = `<span class="cell-idx">${i}</span>${k}`;
      if (hl.active === i) cell.classList.add('active');
      if (hl.parent === i) cell.classList.add('parent');
      if (hl.swap && hl.swap.includes(i)) cell.classList.add('swap');
      if (hl.fixed && hl.fixed.includes(i)) cell.classList.add('sorted');
      listEl.appendChild(cell);
    });
  }

  // Generate steps for percolate up from index i
  function genPercUp(arr, startI) {
    const a = arr.slice();
    const steps = [];
    let i = startI;
    let swapCnt = 0, cmpCnt = 0;
    steps.push({arr:a.slice(), hl:{active:i}, status:`插入新元素 ${a[i]} 到位置 ${i}（最後）`, line:1, swap:swapCnt, cmp:cmpCnt, idx:i, par:i>0?Math.floor((i-1)/2):'—'});
    while (Math.floor((i-1)/2) >= 0 && i > 0) {
      const p = Math.floor((i-1)/2);
      cmpCnt++;
      steps.push({arr:a.slice(), hl:{active:i, parent:p}, status:`比較 heap[${i}]=${a[i]} 與 parent heap[${p}]=${a[p]}`, line:4, swap:swapCnt, cmp:cmpCnt, idx:i, par:p});
      if (a[i] < a[p]) {
        [a[i], a[p]] = [a[p], a[i]];
        swapCnt++;
        steps.push({arr:a.slice(), hl:{swap:[i,p]}, status:`heap[${i}] < heap[${p}]，交換`, line:5, swap:swapCnt, cmp:cmpCnt, idx:p, par:p>0?Math.floor((p-1)/2):'—'});
        i = p;
      } else {
        steps.push({arr:a.slice(), hl:{active:i}, status:`heap[${i}] ≥ heap[${p}]，停止`, line:4, swap:swapCnt, cmp:cmpCnt, idx:i, par:p});
        break;
      }
    }
    steps.push({arr:a.slice(), hl:{}, status:'插入完成 ✓', line:null, swap:swapCnt, cmp:cmpCnt, idx:'—', par:'—', commit:true, finalArr:a.slice()});
    return steps;
  }

  function genPercDown(arr, startI, endI, baseSwap, baseCmp) {
    const a = arr.slice();
    const steps = [];
    let i = startI;
    let swapCnt = baseSwap || 0, cmpCnt = baseCmp || 0;
    while (2*i + 1 <= endI) {
      const li = 2*i + 1, ri = 2*i + 2;
      let mc = li;
      if (ri <= endI) {
        cmpCnt++;
        if (a[ri] < a[li]) mc = ri;
      }
      steps.push({arr:a.slice(), hl:{active:i, parent:mc}, status:`找出 heap[${i}]=${a[i]} 的較小子節點：heap[${mc}]=${a[mc]}`, line:null, swap:swapCnt, cmp:cmpCnt, idx:i, par:mc});
      cmpCnt++;
      if (a[i] > a[mc]) {
        [a[i], a[mc]] = [a[mc], a[i]];
        swapCnt++;
        steps.push({arr:a.slice(), hl:{swap:[i,mc]}, status:`heap[${i}] > heap[${mc}]，下沉`, line:null, swap:swapCnt, cmp:cmpCnt, idx:mc, par:i});
        i = mc;
      } else {
        steps.push({arr:a.slice(), hl:{active:i}, status:`heap 性質已滿足，停止`, line:null, swap:swapCnt, cmp:cmpCnt, idx:i, par:mc});
        break;
      }
    }
    return { steps, finalArr: a, swapCnt, cmpCnt };
  }

  function genInsertSteps(arr, key) {
    const a = arr.concat([key]);
    return genPercUp(a, a.length - 1);
  }

  function genDeleteSteps(arr) {
    if (arr.length === 0) return [{arr:[], hl:{}, status:'空 heap，無法 delete', line:null, swap:0, cmp:0, idx:'—', par:'—', commit:true, finalArr:[]}];
    const a = arr.slice();
    const steps = [];
    steps.push({arr:a.slice(), hl:{active:0}, status:`記下 root = ${a[0]}（min 值）`, line:null, swap:0, cmp:0, idx:0, par:'—'});
    const last = a.length - 1;
    if (last === 0) {
      a.pop();
      steps.push({arr:a.slice(), hl:{}, status:'只有一個元素，移除即可 ✓', line:null, swap:0, cmp:0, idx:'—', par:'—', commit:true, finalArr:[]});
      return steps;
    }
    steps.push({arr:a.slice(), hl:{swap:[0,last]}, status:`把最後元素 heap[${last}]=${a[last]} 換到 root`, line:null, swap:1, cmp:0, idx:last, par:0});
    [a[0], a[last]] = [a[last], a[0]];
    steps.push({arr:a.slice(), hl:{active:0}, status:`移除原 root（現在在最後位置）`, line:null, swap:1, cmp:0, idx:0, par:'—'});
    a.pop();
    steps.push({arr:a.slice(), hl:{active:0}, status:'對 root 做 perc_down 修復 heap 性質', line:null, swap:1, cmp:0, idx:0, par:'—'});
    const r = genPercDown(a, 0, a.length-1, 1, 0);
    steps.push(...r.steps);
    steps.push({arr:r.finalArr.slice(), hl:{}, status:'delete-min 完成 ✓', line:null, swap:r.swapCnt, cmp:r.cmpCnt, idx:'—', par:'—', commit:true, finalArr:r.finalArr.slice()});
    return steps;
  }

  function genHeapifySteps(arr) {
    const a = arr.slice();
    const steps = [];
    const start = Math.floor(a.length / 2) - 1;
    steps.push({arr:a.slice(), hl:{}, status:`從中間 i = ⌊n/2⌋ - 1 = ${start} 開始倒著做 perc_down`, line:null, swap:0, cmp:0, idx:start, par:'—'});
    let totalSwap = 0, totalCmp = 0;
    let cur = a.slice();
    const fixed = [];
    for (let i = start; i >= 0; i--) {
      steps.push({arr:cur.slice(), hl:{active:i, fixed:fixed.slice()}, status:`對 heap[${i}]=${cur[i]} 做 perc_down`, line:null, swap:totalSwap, cmp:totalCmp, idx:i, par:'—'});
      const r = genPercDown(cur, i, cur.length-1, totalSwap, totalCmp);
      // Inject fixed indices into each step
      r.steps.forEach(s => {
        s.hl = Object.assign({}, s.hl, {fixed: fixed.slice()});
        steps.push(s);
      });
      cur = r.finalArr;
      totalSwap = r.swapCnt;
      totalCmp = r.cmpCnt;
      fixed.push(i);
    }
    steps.push({arr:cur.slice(), hl:{fixed:cur.map((_,i)=>i)}, status:'heapify 完成，整棵樹滿足 heap 性質 ✓', line:null, swap:totalSwap, cmp:totalCmp, idx:'—', par:'—', commit:true, finalArr:cur.slice()});
    return steps;
  }

  function applyStep(s) {
    renderHeap(s.arr, s.hl || {});
    $$('heapStatus').textContent = s.status || '';
    $$('heapSwap').textContent = s.swap;
    $$('heapCmp').textContent = s.cmp;
    $$('heapIdx').textContent = s.idx;
    $$('heapPar').textContent = s.par;
    hlLine($$('heapCode'), s.line);
    if (s.commit && s.finalArr) {
      heapArr = s.finalArr.slice();
      $$('heapArrInput').value = heapArr.join(', ');
    }
  }

  function regen(steps) {
    if (player) player.stop();
    player = new Player({
      steps,
      apply: applyStep,
      delay: parseInt($$('heapSpeed').value, 10)
    });
    player.reset();
  }

  function startOp() {
    if (currentOp === 'insert') {
      const k = parseInt($$('heapInsertKey').value, 10);
      if (isNaN(k)) return;
      regen(genInsertSteps(heapArr, k));
    } else if (currentOp === 'delete') {
      regen(genDeleteSteps(heapArr));
    } else if (currentOp === 'heapify') {
      // Use the input array as-is (unsorted)
      const raw = $$('heapArrInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
      heapArr = raw;
      regen(genHeapifySteps(raw));
    }
  }

  // Wire up controls — operation toggle row is panel-scoped.
  const opButtons = panelRoot.querySelectorAll('.preset-btn[data-op]');
  if (lockedOp) {
    // Set the active preset to the locked op and hide the toggle row entirely.
    opButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.op === currentOp);
    });
    if (opButtons.length) {
      const row = opButtons[0].closest('.preset-row');
      if (row) row.style.display = 'none';
    }
  } else {
    opButtons.forEach(btn => {
      btn.onclick = () => {
        panelRoot.querySelectorAll('.preset-btn[data-op]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentOp = btn.dataset.op;
        $$('heapStatus').textContent = currentOp === 'insert' ? '輸入 key 後按「插入」或「開始」' :
                                       currentOp === 'delete' ? '按「開始」執行 delete-min' :
                                       '陣列當作未排序輸入，按「開始」做 heapify';
      };
    });
  }

  if ($$('heapInsertBtn')) $$('heapInsertBtn').onclick = startOp;
  if ($$('heapApplyArr')) $$('heapApplyArr').onclick = () => {
    const raw = $$('heapArrInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    heapArr = raw;
    renderHeap(heapArr, {});
    $$('heapStatus').textContent = '已套用陣列。若要 heapify 修復，選擇「Heapify」並按「開始」';
  };
  $$('heapPlay').onclick = () => {
    if (player && player.idx > 0 && player.idx < player.steps.length - 1) {
      player.play();
    } else {
      startOp();
      if (player) player.play();
    }
  };
  $$('heapStep').onclick = () => {
    if (!player || player.idx >= player.steps.length - 1) startOp();
    else player.step();
  };
  $$('heapReset').onclick = () => {
    if (player) player.stop();
    if ($$('heapArrInput')) {
      heapArr = $$('heapArrInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    }
    renderHeap(heapArr, {});
    $$('heapStatus').textContent = '已重置。';
    $$('heapSwap').textContent = '0'; $$('heapCmp').textContent = '0';
    $$('heapIdx').textContent = '—'; $$('heapPar').textContent = '—';
    hlLine($$('heapCode'), null);
  };
  $$('heapSpeed').addEventListener('input', () => {
    if (player) player.setDelay(parseInt($$('heapSpeed').value, 10));
  });

  renderHeap(heapArr, {});
  return { resize: () => renderHeap(heapArr, {}) };
}

/* ============================================================
   PART 06 — BINARY SEARCH TREE (BST)
   ============================================================ */
function initBST(suffix = '', lockedOp = null) {
  const $$ = (id) => document.getElementById(id + suffix);
  const canvas = $$('canvas-bst');
  if (!canvas) return;
  const panelRoot = canvas.closest('.ds09-anim');

  // Map external lockedOp ('search'|'insert') onto internal data-bstop ('get'|'put').
  const opMap = { search: 'get', insert: 'put' };
  const initialBstOp = lockedOp ? (opMap[lockedOp] || lockedOp) : null;

  let root = null;
  let player = null;

  // Pseudo-code variants for put vs get; line numbers in genOpSteps refer to these.
  const codeTemplates = {
    put: {
      title: '虛擬碼 — _put <span class="ic-badge" style="background:var(--accent2)">CODE</span>',
      html: '<span class="line" data-l="1"><span class="kw">def</span> <span class="fn">_put</span>(key, val, cur):</span>\n' +
            '<span class="line" data-l="2">    <span class="kw">if</span> key &lt; cur.key:</span>\n' +
            '<span class="line" data-l="3">        <span class="kw">if</span> cur.left:</span>\n' +
            '<span class="line" data-l="4">            <span class="fn">_put</span>(key, val, cur.left)</span>\n' +
            '<span class="line" data-l="5">        <span class="kw">else</span>:</span>\n' +
            '<span class="line" data-l="6">            cur.left = <span class="fn">TreeNode</span>(key, val)</span>\n' +
            '<span class="line" data-l="7">    <span class="kw">else</span>:</span>\n' +
            '<span class="line" data-l="8">        <span class="kw">if</span> cur.right:</span>\n' +
            '<span class="line" data-l="9">            <span class="fn">_put</span>(key, val, cur.right)</span>\n' +
            '<span class="line" data-l="10">        <span class="kw">else</span>:</span>\n' +
            '<span class="line" data-l="11">            cur.right = <span class="fn">TreeNode</span>(key, val)</span>'
    },
    get: {
      title: '虛擬碼 — _get <span class="ic-badge" style="background:var(--accent2)">CODE</span>',
      html: '<span class="line" data-l="1"><span class="kw">def</span> <span class="fn">_get</span>(key, cur):</span>\n' +
            '<span class="line" data-l="2">    <span class="kw">if not</span> cur: <span class="kw">return None</span></span>\n' +
            '<span class="line" data-l="3">    <span class="kw">if</span> cur.key == key:</span>\n' +
            '<span class="line" data-l="4">        <span class="kw">return</span> cur</span>\n' +
            '<span class="line" data-l="5">    <span class="kw">elif</span> key &lt; cur.key:</span>\n' +
            '<span class="line" data-l="6">        <span class="kw">return</span> <span class="fn">_get</span>(key, cur.left)</span>\n' +
            '<span class="line" data-l="7">    <span class="kw">else</span>:</span>\n' +
            '<span class="line" data-l="8">        <span class="kw">return</span> <span class="fn">_get</span>(key, cur.right)</span>'
    }
  };

  function setCodePanel(opName) {
    const tpl = codeTemplates[opName] || codeTemplates.put;
    $$('bstCodeTitle').innerHTML = tpl.title;
    $$('bstCode').innerHTML = tpl.html;
  }

  function bstInsert(r, key) {
    if (!r) return new TNode(key);
    if (key === r.key) return r;
    if (key < r.key) {
      r.left = bstInsert(r.left, key);
      r.left.parent = r;
    } else {
      r.right = bstInsert(r.right, key);
      r.right.parent = r;
    }
    return r;
  }

  function buildBST(keys) {
    let r = null;
    for (const k of keys) r = bstInsert(r, k);
    return r;
  }

  function render(hlPath, currentNode, status) {
    const w = canvas.clientWidth || 600;
    const h = parseInt(canvas.style.height) || 380;
    if (root) layoutTree(root, w, h, 38, 36);
    renderTree(canvas, root);
    clearHL(canvas);
    if (hlPath) {
      hlPath.forEach(n => {
        if (n) setNodeClass(canvas, n.id, 'path');
      });
      // Edges along path
      for (let i = 0; i < hlPath.length - 1; i++) {
        if (hlPath[i] && hlPath[i+1]) {
          setEdgeClass(canvas, hlPath[i].id, hlPath[i+1].id, 'path');
        }
      }
    }
    if (currentNode) setNodeClass(canvas, currentNode.id, 'current');
    if (status != null) $$('bstStatus').textContent = status;
    $$('bstHeight').textContent = treeHeight(root);
    $$('bstSize').textContent = nodeCount(root);
  }

  // Generate steps for a put or get operation
  // Line-number maps for the two pseudo-code templates
  const lineMap = {
    put: { visitLT: 2, visitGTE: 7, goLeft: 4, goRight: 9, insertLeft: 6, insertRight: 11, foundEq: null, notFound: null },
    get: { visitLT: 5, visitGTE: 7, goLeft: 6, goRight: 8, insertLeft: null, insertRight: null, foundEq: 4, notFound: 2 }
  };

  function genOpSteps(op, key) {
    const L = lineMap[op] || lineMap.put;
    const steps = [];
    if (!root) {
      if (op === 'put') {
        steps.push({type:'init-empty', key, status:`空樹，建立 root = ${key}`, line:null});
        steps.push({type:'commit-root', key, status:`插入完成 ✓`, line:null});
      } else {
        steps.push({type:'noop', status:`空樹，找不到 ${key}`, result:'NOT FOUND', line:L.notFound});
      }
      return steps;
    }
    let cur = root;
    const path = [];
    let cmp = 0;
    while (cur) {
      path.push(cur);
      cmp++;
      steps.push({type:'visit', node:cur, path:path.slice(), status:`比較 key=${key} 與 ${cur.key}`, line: key < cur.key ? L.visitLT : L.visitGTE, cmp});
      if (key === cur.key) {
        if (op === 'get') {
          steps.push({type:'found', node:cur, path:path.slice(), status:`找到 ${key} ✓`, line:L.foundEq, result:'FOUND', cmp});
        } else {
          steps.push({type:'dup', node:cur, path:path.slice(), status:`key=${key} 已存在，更新 value（不改結構）`, line:null, cmp});
        }
        return steps;
      }
      if (key < cur.key) {
        if (cur.left) {
          steps.push({type:'go-left', node:cur, path:path.slice(), status:`${key} < ${cur.key}，往左`, line:L.goLeft, cmp});
          cur = cur.left;
        } else {
          if (op === 'put') {
            steps.push({type:'insert-left', node:cur, path:path.slice(), key, status:`${key} < ${cur.key} 且 left 為空，插入為左子`, line:L.insertLeft, cmp});
            steps.push({type:'commit', node:cur, path:path.slice(), key, side:'left', status:`插入 ${key} 完成 ✓`, line:null, cmp});
          } else {
            steps.push({type:'not-found', node:cur, path:path.slice(), status:`${key} 不在樹中`, line:L.notFound, result:'NOT FOUND', cmp});
          }
          return steps;
        }
      } else {
        if (cur.right) {
          steps.push({type:'go-right', node:cur, path:path.slice(), status:`${key} > ${cur.key}，往右`, line:L.goRight, cmp});
          cur = cur.right;
        } else {
          if (op === 'put') {
            steps.push({type:'insert-right', node:cur, path:path.slice(), key, status:`${key} > ${cur.key} 且 right 為空，插入為右子`, line:L.insertRight, cmp});
            steps.push({type:'commit', node:cur, path:path.slice(), key, side:'right', status:`插入 ${key} 完成 ✓`, line:null, cmp});
          } else {
            steps.push({type:'not-found', node:cur, path:path.slice(), status:`${key} 不在樹中`, line:L.notFound, result:'NOT FOUND', cmp});
          }
          return steps;
        }
      }
    }
    return steps;
  }

  function applyStep(s) {
    if (s.type === 'commit-root') {
      root = new TNode(s.key);
      render(null, null, s.status);
    } else if (s.type === 'commit') {
      const newN = new TNode(s.key);
      newN.parent = s.node;
      if (s.side === 'left') s.node.left = newN; else s.node.right = newN;
      render(s.path.concat([newN]), newN, s.status);
    } else if (s.type === 'init-empty') {
      $('bstStatus').textContent = s.status;
    } else {
      render(s.path || null, s.node || null, s.status);
    }
    if (s.cmp != null) $$('bstCmp').textContent = s.cmp;
    if (s.node) $$('bstCur').textContent = s.node.key;
    if (s.result) $$('bstResult').textContent = s.result;
    hlLine($$('bstCode'), s.line);
  }

  function startOp(op, key) {
    setCodePanel(op);
    $$('bstOpName').textContent = op === 'put' ? `put(${key})` : `get(${key})`;
    $$('bstResult').textContent = '—';
    $$('bstCmp').textContent = '0';
    if (player) player.stop();
    const steps = genOpSteps(op, key);
    player = new Player({
      steps,
      apply: applyStep,
      delay: parseInt($$('bstSpeed').value, 10)
    });
    player.reset();
    player.play();
  }

  function rebuild() {
    const raw = $$('bstInitInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    root = buildBST(raw);
    render(null, null, `已建立 BST（${raw.length} 個 keys）`);
    $$('bstOpName').textContent = '—';
    $$('bstResult').textContent = '—';
    $$('bstCmp').textContent = '0';
    $$('bstCur').textContent = '—';
    hlLine($$('bstCode'), null);
  }

  // Wire — operation buttons are panel-scoped.
  const bstOpButtons = panelRoot.querySelectorAll('button[data-bstop]');
  if (initialBstOp) {
    // Hide non-matching op buttons; keep only the locked op visible & active.
    bstOpButtons.forEach(b => {
      if (b.dataset.bstop !== initialBstOp) b.style.display = 'none';
    });
    setCodePanel(initialBstOp);
  }
  bstOpButtons.forEach(btn => {
    btn.onclick = () => {
      const k = parseInt($$('bstOpKey').value, 10);
      if (isNaN(k)) return;
      startOp(btn.dataset.bstop, k);
    };
  });
  $$('bstApplyInit').onclick = rebuild;
  $$('bstShuffle').onclick = () => {
    const arr = $$('bstInitInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    $$('bstInitInput').value = arr.join(', ');
    rebuild();
  };
  $$('bstStep').onclick = () => { if (player) player.step(); };
  $$('bstReset').onclick = rebuild;
  $$('bstSpeed').addEventListener('input', () => {
    if (player) player.setDelay(parseInt($$('bstSpeed').value, 10));
  });

  rebuild();
  return { resize: () => render(null, null, null) };
}

/* ============================================================
   PART 07 — BST DELETE (three cases)
   ============================================================ */
function initBSTDelete(suffix = '') {
  const $$ = (id) => document.getElementById(id + suffix);
  const canvas = $$('canvas-bstdel');
  if (!canvas) return;
  const panelRoot = canvas.closest('.ds09-anim');

  let root = null;
  let player = null;

  function bstInsert(r, key) {
    if (!r) return new TNode(key);
    if (key === r.key) return r;
    if (key < r.key) { r.left = bstInsert(r.left, key); r.left.parent = r; }
    else { r.right = bstInsert(r.right, key); r.right.parent = r; }
    return r;
  }
  function buildBST(keys) { let r=null; for (const k of keys) r = bstInsert(r, k); return r; }

  function findMin(n) { while (n.left) n = n.left; return n; }

  function findNode(r, key) {
    let cur = r; const path = [];
    while (cur) {
      path.push(cur);
      if (key === cur.key) return { node: cur, path };
      cur = key < cur.key ? cur.left : cur.right;
    }
    return { node: null, path };
  }

  function classifyCase(node) {
    if (!node.left && !node.right) return 1;
    if (!node.left || !node.right) return 2;
    return 3;
  }

  function render(hl) {
    hl = hl || {};
    const w = canvas.clientWidth || 600;
    const h = parseInt(canvas.style.height) || 360;
    if (root) layoutTree(root, w, h, 38, 36);
    renderTree(canvas, root);
    clearHL(canvas);
    if (hl.path) {
      hl.path.forEach(n => { if (n) setNodeClass(canvas, n.id, 'path'); });
      for (let i = 0; i < hl.path.length-1; i++) {
        if (hl.path[i] && hl.path[i+1]) setEdgeClass(canvas, hl.path[i].id, hl.path[i+1].id, 'path');
      }
    }
    if (hl.target) setNodeClass(canvas, hl.target.id, 'current');
    if (hl.successor) setNodeClass(canvas, hl.successor.id, 'target');
    if (hl.deleted) setNodeClass(canvas, hl.deleted.id, 'deleted');
  }

  function genDeleteSteps(key) {
    const steps = [];
    if (!root) {
      steps.push({status:'空樹，無法刪除', case:'—'});
      return steps;
    }
    const { node: target, path } = findNode(root, key);
    if (!target) {
      steps.push({status:`key=${key} 不在樹中`, case:'—', hl:{path}});
      return steps;
    }
    steps.push({status:`從 root 出發找 key=${key}`, hl:{path:[path[0]]}, case:'?', target:key, succ:'—', phase:'搜尋'});
    for (let i = 1; i < path.length; i++) {
      steps.push({status:`下移到節點 ${path[i].key}`, hl:{path:path.slice(0,i+1), target: i===path.length-1 ? path[i] : null}, case:'?', target:key, succ:'—', phase:'搜尋'});
    }
    const c = classifyCase(target);
    steps.push({status:`找到 target=${target.key}，分類為 Case ${c}`, hl:{path, target}, case:`Case ${c}`, target:target.key, succ:'—', phase:'分類'});
    if (c === 1) {
      steps.push({status:`葉節點：直接從 parent 把它的 link 設為 null`, hl:{path, deleted:target}, case:'Case 1', target:target.key, succ:'—', phase:'splice'});
      steps.push({status:'刪除完成 ✓', commit:'remove-leaf', target, case:'Case 1', phase:'完成', succ:'—'});
    } else if (c === 2) {
      const child = target.left || target.right;
      const side = target.left ? 'left' : 'right';
      steps.push({status:`只有一個子（${side}=${child.key}），把它「提升」上來取代 target`, hl:{path, target, successor:child}, case:'Case 2', target:target.key, succ:'—', phase:'lift'});
      steps.push({status:'刪除完成 ✓', commit:'lift-child', target, child, case:'Case 2', phase:'完成', succ:'—'});
    } else {
      steps.push({status:`兩個子節點 → 找 in-order successor（右子樹中最小）`, hl:{path, target}, case:'Case 3', target:target.key, succ:'?', phase:'找 successor'});
      // Walk right subtree to find min
      let cur = target.right;
      const succPath = [target, cur];
      steps.push({status:`進入右子樹 → ${cur.key}`, hl:{path, target, successor:cur}, case:'Case 3', target:target.key, succ:cur.key, phase:'找 successor'});
      while (cur.left) {
        cur = cur.left;
        succPath.push(cur);
        steps.push({status:`往左：→ ${cur.key}`, hl:{path, target, successor:cur}, case:'Case 3', target:target.key, succ:cur.key, phase:'找 successor'});
      }
      const succ = cur;
      steps.push({status:`找到 successor = ${succ.key}（必為 case 1 或 case 2）`, hl:{path, target, successor:succ}, case:'Case 3', target:target.key, succ:succ.key, phase:'splice succ'});
      steps.push({status:`把 successor 的 key=${succ.key} 拷貝到 target 位置`, hl:{path, target, successor:succ}, case:'Case 3', target:target.key, succ:succ.key, phase:'copy key', commit:'copy-key', target, succ});
      steps.push({status:`從原位置 splice out successor（最多一個 right child）`, hl:{deleted:succ}, case:'Case 3', target:succ.key, succ:succ.key, phase:'splice succ'});
      steps.push({status:'刪除完成 ✓', commit:'splice-succ', succ, case:'Case 3', phase:'完成', target:succ.key, succ:succ.key});
    }
    return steps;
  }

  function applyStep(s) {
    if (s.commit === 'remove-leaf') {
      const t = s.target;
      if (t.parent) {
        if (t.parent.left === t) t.parent.left = null;
        else t.parent.right = null;
      } else { root = null; }
      render({});
    } else if (s.commit === 'lift-child') {
      const t = s.target, c = s.child;
      c.parent = t.parent;
      if (t.parent) {
        if (t.parent.left === t) t.parent.left = c;
        else t.parent.right = c;
      } else { root = c; }
      render({});
    } else if (s.commit === 'copy-key') {
      s.target.key = s.succ.key;
      render({target: s.target, successor: s.succ});
    } else if (s.commit === 'splice-succ') {
      const succ = s.succ;
      // succ has at most a right child
      const child = succ.right;
      if (succ.parent) {
        if (succ.parent.left === succ) succ.parent.left = child;
        else succ.parent.right = child;
        if (child) child.parent = succ.parent;
      } else {
        root = child;
        if (child) child.parent = null;
      }
      render({});
    } else {
      render(s.hl || {});
    }
    if (s.status != null) $$('delStatus').textContent = s.status;
    if (s.case != null) $$('delCase').textContent = s.case;
    if (s.target != null) $$('delTarget').textContent = s.target;
    if (s.succ != null) $$('delSucc').textContent = s.succ;
    if (s.phase != null) $$('delPhase').textContent = s.phase;
  }

  function rebuild() {
    const raw = $$('delInitInput').value.split(/[\s,]+/).map(s=>parseInt(s,10)).filter(n=>!isNaN(n));
    root = buildBST(raw);
    render({});
    $$('delStatus').textContent = `已建立 BST（${raw.length} 個 keys）。選擇 key 並按「刪除」`;
    $$('delCase').textContent = '—';
    $$('delTarget').textContent = '—';
    $$('delSucc').textContent = '—';
    $$('delPhase').textContent = '—';
  }

  function startDel() {
    const k = parseInt($$('delKey').value, 10);
    if (isNaN(k)) return;
    if (player) player.stop();
    const steps = genDeleteSteps(k);
    player = new Player({ steps, apply: applyStep, delay: 800 });
    player.reset();
    player.play();
  }

  $$('delApplyInit').onclick = rebuild;
  $$('delPlay').onclick = startDel;
  $$('delStep').onclick = () => { if (!player) startDel(); else player.step(); };
  $$('delReset').onclick = rebuild;
  panelRoot.querySelectorAll('.preset-btn[data-delk]').forEach(btn => {
    btn.onclick = () => {
      $$('delKey').value = btn.dataset.delk;
      rebuild();
      setTimeout(startDel, 50);
    };
  });

  rebuild();
  return { resize: () => render({}) };
}

/* ============================================================
   PART 08 — BST ANALYSIS (random vs sorted)
   ============================================================ */
function initBSTAnalysis() {
  const cRand = $('canvas-bstrand');
  const cSorted = $('canvas-bstsorted');
  if (!cRand || !cSorted) return;

  function bstInsert(r, key) {
    if (!r) return new TNode(key);
    if (key === r.key) return r;
    if (key < r.key) { r.left = bstInsert(r.left, key); r.left.parent = r; }
    else { r.right = bstInsert(r.right, key); r.right.parent = r; }
    return r;
  }
  function buildBST(keys) { TNode._id = 0; let r=null; for (const k of keys) r = bstInsert(r, k); return r; }

  function avgDepth(root) {
    if (!root) return 0;
    let total = 0, count = 0;
    (function walk(n, d) {
      if (!n) return;
      total += d; count++;
      walk(n.left, d+1); walk(n.right, d+1);
    })(root, 0);
    return count > 0 ? (total / count) : 0;
  }

  function regen() {
    const n = parseInt($('bstAnalN').value, 10) || 10;
    // Random distinct integers between 1 and 99
    const arr = [];
    while (arr.length < n) {
      const x = Math.floor(Math.random()*99) + 1;
      if (!arr.includes(x)) arr.push(x);
    }
    const sortedArr = arr.slice().sort((a,b)=>a-b);

    const rRoot = buildBST(arr);
    const sRoot = buildBST(sortedArr);

    const wR = cRand.clientWidth || 380, hR = parseInt(cRand.style.height) || 280;
    const wS = cSorted.clientWidth || 380, hS = parseInt(cSorted.style.height) || 280;

    if (rRoot) layoutTree(rRoot, wR, hR, 30, 30);
    renderTree(cRand, rRoot);
    if (sRoot) layoutTree(sRoot, wS, hS, 30, 30);
    renderTree(cSorted, sRoot);

    $('bstRandH').textContent = treeHeight(rRoot);
    $('bstSortedH').textContent = treeHeight(sRoot);
  }

  $('bstAnalRegen').onclick = regen;
  regen();
  return { resize: regen };
}

/* ============================================================
   PART 09 — AVL ROTATIONS
   ============================================================ */
function initAVL() {
  const canvas = $('canvas-avl');
  if (!canvas) return;

  let currentCase = 'LL';
  let player = null;

  // Build a tree using preorder array form. null = empty.
  function build(arr) { TNode._id = 0; const idx={i:0}; return buildFromArr(arr, idx); }

  // For each case, define the BEFORE tree, the rotation steps, and the AFTER labels.
  // We use letter labels A, B, C, x, y, z to make rotations didactic.
  const cases = {
    LL: {
      label: 'LL — 右旋 (Right Rotate)',
      fix: '對 z 做單一右旋',
      // Before (left-left heavy): z(top), y=z.left, x=y.left, A=x.left, B=x.right, C=y.right, D=z.right
      buildBefore: () => build(['z','y','x','A',null,null,'B',null,null,'C',null,null,'D',null,null]),
      narrate: [
        '初始：z 的 left subtree (rooted at y) 比 right (D) 高 2。',
        'bf(z) = +2，且 bf(y) = +1，屬於 LL → 右旋',
        '右旋：把 y 拉上來當 root，z 變成 y 的 right child。',
        '原本 y 的 right (C) 變成 z 的 left。',
        '完成：bf(y) = 0，所有節點都平衡 ✓'
      ],
      buildAfter: () => build(['y','x','A',null,null,'B',null,null,'z','C',null,null,'D',null,null])
    },
    RR: {
      label: 'RR — 左旋 (Left Rotate)',
      fix: '對 z 做單一左旋',
      buildBefore: () => build(['z','A',null,null,'y','B',null,null,'x','C',null,null,'D',null,null]),
      narrate: [
        '初始：z 的 right subtree (rooted at y) 比 left (A) 高 2。',
        'bf(z) = -2，且 bf(y) = -1，屬於 RR → 左旋',
        '左旋：把 y 拉上來當 root，z 變成 y 的 left child。',
        '原本 y 的 left (B) 變成 z 的 right。',
        '完成：bf(y) = 0，所有節點都平衡 ✓'
      ],
      buildAfter: () => build(['y','z','A',null,null,'B',null,null,'x','C',null,null,'D',null,null])
    },
    LR: {
      label: 'LR — 左右旋 (Left-Right)',
      fix: '先對 y 左旋，再對 z 右旋',
      buildBefore: () => build(['z','y','A',null,null,'x','B',null,null,'C',null,null,'D',null,null]),
      narrate: [
        '初始：z left-heavy (bf=+2)，但 y right-heavy (bf=-1)，屬於 LR',
        '步驟一：對 y 做左旋 → 變成 LL 形狀',
        '步驟二：對 z 做右旋',
        '完成：x 成為新 root，所有節點都平衡 ✓'
      ],
      mid: () => build(['z','x','y','A',null,null,'B',null,null,'C',null,null,'D',null,null]),
      buildAfter: () => build(['x','y','A',null,null,'B',null,null,'z','C',null,null,'D',null,null])
    },
    RL: {
      label: 'RL — 右左旋 (Right-Left)',
      fix: '先對 y 右旋，再對 z 左旋',
      buildBefore: () => build(['z','A',null,null,'y','x','B',null,null,'C',null,null,'D',null,null]),
      narrate: [
        '初始：z right-heavy (bf=-2)，但 y left-heavy (bf=+1)，屬於 RL',
        '步驟一：對 y 做右旋 → 變成 RR 形狀',
        '步驟二：對 z 做左旋',
        '完成：x 成為新 root，所有節點都平衡 ✓'
      ],
      mid: () => build(['z','A',null,null,'x','B',null,null,'y','C',null,null,'D',null,null]),
      buildAfter: () => build(['x','z','A',null,null,'B',null,null,'y','C',null,null,'D',null,null])
    }
  };

  function render(root, status) {
    const w = canvas.clientWidth || 600;
    const h = parseInt(canvas.style.height) || 380;
    if (root) layoutTree(root, w, h, 38, 36);
    renderTree(canvas, root);
    if (status != null) $('avlStatus').textContent = status;
  }

  function genSteps() {
    const c = cases[currentCase];
    const steps = [];
    steps.push({tree: c.buildBefore(), status: c.narrate[0], phase:'BEFORE', bf:'+2 / -2'});
    steps.push({tree: c.buildBefore(), status: c.narrate[1], phase:'分類', bf:'判斷'});
    if (c.mid) {
      steps.push({tree: c.mid(), status: c.narrate[2], phase:'第一次旋轉', bf:'中繼'});
      steps.push({tree: c.buildAfter(), status: c.narrate[3], phase:'完成', bf:'0'});
    } else {
      steps.push({tree: c.buildAfter(), status: c.narrate[2], phase:'旋轉', bf:'進行中'});
      steps.push({tree: c.buildAfter(), status: c.narrate[3], phase:'更新', bf:'0'});
      steps.push({tree: c.buildAfter(), status: c.narrate[4], phase:'完成', bf:'0'});
    }
    return steps;
  }

  function applyStep(s) {
    render(s.tree, s.status);
    if (s.phase != null) $('avlPhase').textContent = s.phase;
    if (s.bf != null) $('avlBf').textContent = s.bf;
  }

  function regen() {
    const c = cases[currentCase];
    $('avlCase').textContent = currentCase;
    $('avlFix').textContent = c.fix;
    $('avlPhase').textContent = '—';
    $('avlBf').textContent = '—';
    if (player) player.stop();
    player = new Player({
      steps: genSteps(),
      apply: applyStep,
      delay: parseInt($('avlSpeed').value, 10)
    });
    player.reset();
  }

  document.querySelectorAll('#avl .preset-btn[data-avlcase]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#avl .preset-btn[data-avlcase]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCase = btn.dataset.avlcase;
      regen();
    };
  });
  $('avlPlay').onclick = () => { if (player) player.play(); };
  $('avlStep').onclick = () => { if (player) player.step(); };
  $('avlReset').onclick = regen;
  $('avlSpeed').addEventListener('input', () => {
    if (player) player.setDelay(parseInt($('avlSpeed').value, 10));
  });

  regen();
  return { resize: regen };
}

/* ============================================================
   FLOATING NAV — scroll-tracking active link
   ============================================================ */

  /* ============================================================
     Public surface — caller-driven init (one entry per panel).
     Each panel HTML is responsible for invoking these *after* its
     DOM markup is in place. The init functions are guarded by an
     early `if (!canvas) return` so calling before the markup is a
     safe no-op.
     ============================================================ */
  const _initialized = new Set();
  const _once = (name, fn) => () => {
    if (_initialized.has(name)) return; _initialized.add(name); return fn();
  };

  window.DS09 = {
    init: {
      // PART 04 — Tree traversals (cells 129/136/144 in 09 ipynb).
      preorder:    _once('preorder',    () => initTraversals('Pre',  'preorder')),
      inorder:     _once('inorder',     () => initTraversals('In',   'inorder')),
      postorder:   _once('postorder',   () => initTraversals('Post', 'postorder')),
      // PART 05 — Binary heap (cells 185/198/207).
      heapInsert:  _once('heapInsert',  () => initHeap('Ins',   'insert')),
      heapExtract: _once('heapExtract', () => initHeap('Ext',   'extract')),
      heapBuild:   _once('heapBuild',   () => initHeap('Build', 'build')),
      // PART 06 — BST search/insert/delete (cells 231/254/285).
      bstSearch:   _once('bstSearch',   () => initBST('Search', 'search')),
      bstInsert:   _once('bstInsert',   () => initBST('Insert', 'insert')),
      bstDelete:   _once('bstDelete',   () => initBSTDelete('Del')),
    }
  };

  // window resize (debounced) — re-layout open panels.
  let _t = null;
  window.addEventListener('resize', () => {
    if (_t) clearTimeout(_t);
    _t = setTimeout(() => {
      // No-op for now: each init's regen() runs on its own clientWidth read.
    }, 150);
  });
})();
