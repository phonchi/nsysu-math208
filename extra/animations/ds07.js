(function() {
  if (window.DS07) return;     // already loaded — avoid redeclaration on re-run
  // The body below was lifted verbatim from searching_sorting.html (utilities,
  // BarVis, Animator, frame generators, wireSection, init* functions).
  // It is wrapped in this IIFE so the local `$` helper does NOT shadow jQuery.

/* ============================================================
   SHARED UTILITIES
   ============================================================ */

function $(id) { return document.getElementById(id); }

function parseArr(text, len) {
  const out = text.split(/[,\s]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  if (typeof len === 'number') return out.slice(0, len);
  return out;
}

function range(a, b) { const r = []; for (let i = a; i < b; i++) r.push(i); return r; }
function shuffleArr(arr) { const a = [...arr]; for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
function randomArray(n, max) { const arr = []; for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * (max - 5)) + 5); return arr; }

/* ============================================================
   BAR VISUALIZATION
   ============================================================ */
class BarVis {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.barsEl = canvasEl.querySelector('.bars-container');
    this.bars = [];        // bars[origIdx] = {el, value, idxLabel}
    this.pointers = {};    // {name: {el, idx}}
    this.brackets = [];    // bracket bars (for merge/quick)
    this.canvasH = 0;
    this.canvasW = 0;
    this.barWidth = 0;
    this.gap = 4;
    this.barAreaTop = 50;
    this.barAreaBottom = 50;
  }

  setData(arr) {
    this.barsEl.innerHTML = '';
    this.bars = [];
    this.pointers = {};        // clear stale pointer refs (DOM nodes were removed)
    this.brackets = [];        // clear stale bracket refs
    this.lastFrame = null;
    this.values = [...arr];
    this.origIdx = arr.map((_, i) => i);
    const N = arr.length;
    this.layout();

    arr.forEach((v, i) => {
      const el = document.createElement('div');
      el.className = 'bar';
      el.textContent = v;
      this.barsEl.appendChild(el);

      const lab = document.createElement('div');
      lab.className = 'idx-label';
      lab.textContent = i;
      this.barsEl.appendChild(lab);

      this.bars.push({el, value: v, idxLabel: lab});
    });
    this.applyLayout();
  }

  layout() {
    this.canvasW = this.canvas.clientWidth;
    this.canvasH = this.canvas.clientHeight;
    const N = this.values ? this.values.length : 1;
    const totalGap = (N - 1) * this.gap;
    this.barWidth = Math.max(20, (this.canvasW - 20 - totalGap) / N);
    this.startX = (this.canvasW - (N * this.barWidth + totalGap)) / 2;
  }

  positionFor(idx) { return this.startX + idx * (this.barWidth + this.gap); }

  applyLayout() {
    if (!this.values) return;
    const maxV = Math.max(...this.values, 1);
    const usableH = this.canvasH - this.barAreaTop - this.barAreaBottom;
    for (let pos = 0; pos < this.values.length; pos++) {
      const oi = this.origIdx[pos];
      const bar = this.bars[oi];
      bar.el.style.width = this.barWidth + 'px';
      bar.el.style.left = this.positionFor(pos) + 'px';
      bar.el.style.height = (bar.value / maxV * usableH + 22) + 'px';
      bar.idxLabel.style.left = (this.positionFor(pos)) + 'px';
      bar.idxLabel.style.width = this.barWidth + 'px';
    }
  }

  applyFrame(frame) {
    this.values = [...frame.arr];
    if (frame.origIdx) this.origIdx = [...frame.origIdx];

    const maxV = Math.max(...this.values, 1);
    const usableH = this.canvasH - this.barAreaTop - this.barAreaBottom;

    for (let pos = 0; pos < this.values.length; pos++) {
      const oi = this.origIdx[pos];
      const bar = this.bars[oi];
      bar.value = this.values[pos];
      bar.el.textContent = this.values[pos];
      bar.el.style.left = this.positionFor(pos) + 'px';
      bar.el.style.height = (bar.value / maxV * usableH + 22) + 'px';
      bar.el.className = 'bar';

      bar.idxLabel.style.left = this.positionFor(pos) + 'px';
      bar.idxLabel.style.width = this.barWidth + 'px';
      bar.idxLabel.className = 'idx-label';
      bar.idxLabel.textContent = pos;
    }

    if (frame.faded) {
      for (const pos of frame.faded) {
        const oi = this.origIdx[pos];
        if (this.bars[oi]) this.bars[oi].el.classList.add('faded');
      }
    }
    if (frame.eliminated) {
      for (const pos of frame.eliminated) {
        const oi = this.origIdx[pos];
        if (this.bars[oi]) this.bars[oi].el.classList.add('eliminated');
      }
    }
    if (frame.sorted) {
      for (const pos of frame.sorted) {
        const oi = this.origIdx[pos];
        if (this.bars[oi]) this.bars[oi].el.classList.add('sorted');
      }
    }
    if (frame.highlights) {
      for (const [posStr, type] of Object.entries(frame.highlights)) {
        const pos = +posStr;
        const oi = this.origIdx[pos];
        if (this.bars[oi]) {
          this.bars[oi].el.classList.add(type);
          this.bars[oi].idxLabel.classList.add('highlight');
        }
      }
    }

    this.setPointers(frame.pointers || {});
    this.setBrackets(frame.brackets || []);
  }

  setPointers(map) {
    for (const name of Object.keys(this.pointers)) {
      if (!(name in map)) {
        this.pointers[name].el.style.opacity = '0';
        setTimeout(() => { this.pointers[name].el.style.display = 'none'; }, 200);
      }
    }
    for (const [name, info] of Object.entries(map)) {
      let p = this.pointers[name];
      if (!p) {
        const el = document.createElement('div');
        el.className = 'pointer ' + (info.cls || name);
        el.innerHTML = '<div class="arrow"></div>' + (info.label || name);
        this.barsEl.appendChild(el);
        p = this.pointers[name] = {el, idx: info.idx};
      }
      p.el.style.display = 'block';
      p.el.style.opacity = '1';
      p.el.style.width = this.barWidth + 'px';
      p.el.style.left = this.positionFor(info.idx) + 'px';
      p.idx = info.idx;
    }
  }

  setBrackets(arr) {
    for (const b of this.brackets) b.remove();
    this.brackets = [];
    for (const br of arr) {
      const el = document.createElement('div');
      el.className = 'subarr-bracket' + (br.cls ? ' ' + br.cls : '');
      el.style.left = (this.positionFor(br.from) - 2) + 'px';
      el.style.width = ((br.to - br.from + 1) * (this.barWidth + this.gap) - this.gap + 4) + 'px';
      el.style.top = (br.row || 0) * 16 + 8 + 'px';
      this.barsEl.appendChild(el);
      if (br.label) {
        const lab = document.createElement('div');
        lab.className = 'subarr-bracket-label';
        lab.style.left = (this.positionFor(br.from) + 4) + 'px';
        lab.style.top = ((br.row || 0) * 16 + 0) + 'px';
        lab.textContent = br.label;
        this.barsEl.appendChild(lab);
        this.brackets.push(lab);
      }
      this.brackets.push(el);
    }
  }

  resize() {
    this.layout();
    this.applyLayout();
    if (this.lastFrame) this.applyFrame(this.lastFrame);
  }
}

/* ============================================================
   ANIMATOR
   ============================================================ */
class Animator {
  constructor(opts) {
    this.frames = [];
    this.idx = 0;
    this.playing = false;
    this.timer = null;
    this.onFrame = opts.onFrame;
    this.onEnd = opts.onEnd;
    this.getDelay = opts.getDelay;
  }

  setFrames(frames) {
    this.stop();
    this.frames = frames;
    this.idx = 0;
    if (frames.length) this.onFrame(frames[0], 0);
  }

  play() {
    if (this.idx >= this.frames.length - 1) this.idx = 0;
    this.playing = true;
    this._tick();
  }

  pause() { this.playing = false; clearTimeout(this.timer); }
  stop() { this.pause(); this.idx = 0; }

  step() {
    this.pause();
    if (this.idx < this.frames.length - 1) {
      this.idx++;
      this.onFrame(this.frames[this.idx], this.idx);
    }
  }

  reset() {
    this.pause();
    this.idx = 0;
    if (this.frames.length) this.onFrame(this.frames[0], 0);
  }

  _tick() {
    if (!this.playing) return;
    if (this.idx >= this.frames.length - 1) {
      this.playing = false;
      if (this.onEnd) this.onEnd();
      return;
    }
    this.idx++;
    this.onFrame(this.frames[this.idx], this.idx);
    this.timer = setTimeout(() => this._tick(), this.getDelay());
  }
}

/* ============================================================
   FRAME GENERATORS
   ============================================================ */

// --- Sequential Search ---
function genSequentialSearch(arr, target) {
  const frames = [];
  let cmp = 0;
  frames.push({arr:[...arr], origIdx:arr.map((_,i)=>i), highlights:{}, message:`目標：找出 ${target}`, stats:{cmp,pos:'—',result:'搜尋中...'}, pcLine:1});
  for (let pos = 0; pos < arr.length; pos++) {
    cmp++;
    frames.push({arr:[...arr], origIdx:arr.map((_,i)=>i), highlights:{[pos]:'compare'}, message:`比較 a[${pos}]=${arr[pos]} 與目標 ${target}`, stats:{cmp,pos,result:'搜尋中...'}, pcLine:4});
    if (arr[pos] === target) {
      frames.push({arr:[...arr], origIdx:arr.map((_,i)=>i), highlights:{[pos]:'found'}, message:`★ 找到！a[${pos}] = ${target}`, stats:{cmp,pos,result:`True (位置 ${pos})`}, pcLine:5});
      return frames;
    }
  }
  frames.push({arr:[...arr], origIdx:arr.map((_,i)=>i), highlights:{}, faded:range(0,arr.length), message:`✗ 走完整個 list 沒找到 ${target}`, stats:{cmp,pos:'—',result:'False'}, pcLine:7});
  return frames;
}

// --- Binary Search ---
function genBinarySearch(arr, target) {
  const sorted = [...arr].sort((a,b) => a - b);
  const frames = [];
  let cmp = 0;
  let first = 0, last = sorted.length - 1;
  const oi = sorted.map((_,i)=>i);
  frames.push({arr:[...sorted], origIdx:oi, highlights:{}, pointers:{low:{idx:first,label:'first',cls:'low'},high:{idx:last,label:'last',cls:'high'}}, message:`對已排序陣列進行二分搜尋，目標 = ${target}`, stats:{cmp,low:first,high:last,mid:'—',result:'搜尋中...'}, pcLine:3});

  while (first <= last) {
    const midpoint = Math.floor((first + last) / 2);
    cmp++;
    const elimL = range(0, first);
    const elimR = range(last+1, sorted.length);
    frames.push({arr:[...sorted], origIdx:oi, highlights:{[midpoint]:'compare'}, eliminated:[...elimL,...elimR], pointers:{low:{idx:first,label:'first',cls:'low'},high:{idx:last,label:'last',cls:'high'},mid:{idx:midpoint,label:'mid',cls:'mid'}}, message:`midpoint = (${first}+${last})//2 = ${midpoint}，比較 a_list[${midpoint}] = ${sorted[midpoint]} 與 ${target}`, stats:{cmp,low:first,high:last,mid:midpoint,result:'搜尋中...'}, pcLine:5});

    if (sorted[midpoint] === target) {
      frames.push({arr:[...sorted], origIdx:oi, highlights:{[midpoint]:'found'}, eliminated:[...elimL,...elimR], pointers:{mid:{idx:midpoint,label:'mid',cls:'mid'}}, message:`★ 命中！a_list[${midpoint}] = ${target}`, stats:{cmp,low:first,high:last,mid:midpoint,result:`True (位置 ${midpoint})`}, pcLine:7});
      return frames;
    } else if (target < sorted[midpoint]) {
      frames.push({arr:[...sorted], origIdx:oi, highlights:{[midpoint]:'compare'}, eliminated:[...elimL,...elimR,...range(midpoint,sorted.length)], pointers:{low:{idx:first,label:'first',cls:'low'},high:{idx:last,label:'last',cls:'high'},mid:{idx:midpoint,label:'mid',cls:'mid'}}, message:`${target} < ${sorted[midpoint]} → 右半全部排除，last = ${midpoint-1}`, stats:{cmp,low:first,high:last,mid:midpoint,result:'搜尋中...'}, pcLine:9});
      last = midpoint - 1;
    } else {
      frames.push({arr:[...sorted], origIdx:oi, highlights:{[midpoint]:'compare'}, eliminated:[...elimL,...elimR,...range(0,midpoint+1)], pointers:{low:{idx:first,label:'first',cls:'low'},high:{idx:last,label:'last',cls:'high'},mid:{idx:midpoint,label:'mid',cls:'mid'}}, message:`${target} > ${sorted[midpoint]} → 左半全部排除，first = ${midpoint+1}`, stats:{cmp,low:first,high:last,mid:midpoint,result:'搜尋中...'}, pcLine:11});
      first = midpoint + 1;
    }
  }
  frames.push({arr:[...sorted], origIdx:oi, highlights:{}, eliminated:range(0,sorted.length), message:`✗ first (${first}) > last (${last})，沒找到 ${target}`, stats:{cmp,low:first,high:last,mid:'—',result:'False'}, pcLine:12});
  return frames;
}

// --- Bubble Sort ---
function genBubbleSort(initial) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, swp = 0;
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:'初始陣列', stats:{cmp,swp,pass:0}, pcLine:1});
  for (let i = N - 1; i > 0; i--) {
    const sortedSet = range(i+1, N);
    for (let j = 0; j < i; j++) {
      cmp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[j]:'compare',[j+1]:'compare'}, sorted:sortedSet, message:`pass ${N-i}: 比較 a[${j}]=${a[j]} 與 a[${j+1}]=${a[j+1]}`, stats:{cmp,swp,pass:N-i}, pcLine:4});
      if (a[j] > a[j+1]) {
        [a[j], a[j+1]] = [a[j+1], a[j]];
        [oi[j], oi[j+1]] = [oi[j+1], oi[j]];
        swp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[j]:'swap',[j+1]:'swap'}, sorted:sortedSet, message:`${a[j+1]} > ${a[j]} → 交換`, stats:{cmp,swp,pass:N-i}, pcLine:5});
      }
    }
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(i, N), message:`pass ${N-i} 結束：第 ${N-i} 大元素已歸位 (a[${i}]=${a[i]})`, stats:{cmp,swp,pass:N-i}, pcLine:2});
  }
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！共 ${cmp} 次比較、${swp} 次交換`, stats:{cmp,swp,pass:N-1}, pcLine:1});
  return frames;
}

// --- Selection Sort (lecture version: find min, place at front) ---
function genSelectionSort(initial) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, swp = 0;
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:'初始陣列', stats:{cmp,swp,minIdx:'—'}, pcLine:1});
  for (let i = 0; i < N - 1; i++) {
    // Lecture's exact init: min_idx = len(a_list) - 1
    let minIdx = N - 1;
    const sortedSet = range(0, i);
    frames.push({arr:[...a], origIdx:[...oi], highlights:{[minIdx]:'active'}, sorted:sortedSet, message:`pass ${i+1}: 從 a[${i}..${N-1}] 找最小值，依講義初始 min_idx = ${N-1}（最末端），a[${minIdx}]=${a[minIdx]}`, stats:{cmp,swp,minIdx}, pcLine:3});
    for (let j = i; j < N; j++) {
      cmp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[minIdx]:'active',[j]:'compare'}, sorted:sortedSet, message:`比較 a[${j}]=${a[j]} 與目前最小 a[${minIdx}]=${a[minIdx]}`, stats:{cmp,swp,minIdx}, pcLine:5});
      if (a[j] < a[minIdx]) {
        minIdx = j;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[minIdx]:'active'}, sorted:sortedSet, message:`更小！更新 min_idx = ${minIdx}（值 ${a[minIdx]}）`, stats:{cmp,swp,minIdx}, pcLine:6});
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      [oi[i], oi[minIdx]] = [oi[minIdx], oi[i]];
      swp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[i]:'swap',[minIdx]:'swap'}, sorted:sortedSet, message:`交換 a[${minIdx}] ↔ a[${i}]：最小值歸位到 a[${i}]`, stats:{cmp,swp,minIdx}, pcLine:8});
    } else {
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[i]:'sorted'}, sorted:sortedSet, message:`min_idx == i，已在正確位置，無需交換`, stats:{cmp,swp,minIdx}, pcLine:7});
    }
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, i+1), message:`pass ${i+1} 結束：a[${i}]=${a[i]} 已就位`, stats:{cmp,swp,minIdx:'—'}, pcLine:1});
  }
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！${cmp} 次比較、${swp} 次交換（最多 n−1 次）`, stats:{cmp,swp,minIdx:'—'}, pcLine:1});
  return frames;
}

// --- Insertion Sort ---
function genInsertionSort(initial) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, sft = 0;
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:[0], message:'初始：a[0] 自成一個已排序區', stats:{cmp,sft,key:'—'}, pcLine:1});
  for (let i = 1; i < N; i++) {
    const cur_val = a[i];
    const oiKey = oi[i];
    let cur_pos = i;
    const sortedSet = range(0, i);
    frames.push({arr:[...a], origIdx:[...oi], highlights:{[i]:'key'}, sorted:sortedSet, message:`取出 cur_val = a_list[${i}] = ${cur_val}, cur_pos = ${i}`, stats:{cmp,sft,key:cur_val}, pcLine:3});
    while (cur_pos > 0 && a[cur_pos-1] > cur_val) {
      cmp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[cur_pos-1]:'compare',[cur_pos]:'key'}, sorted:sortedSet, message:`比較 a_list[${cur_pos-1}]=${a[cur_pos-1]} 與 cur_val=${cur_val}：${a[cur_pos-1]} > ${cur_val}`, stats:{cmp,sft,key:cur_val}, pcLine:5});
      a[cur_pos] = a[cur_pos-1];
      oi[cur_pos] = oi[cur_pos-1];
      sft++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[cur_pos]:'swap'}, sorted:sortedSet, message:`位移 a_list[${cur_pos-1}] → a_list[${cur_pos}]，cur_pos = ${cur_pos-1}`, stats:{cmp,sft,key:cur_val}, pcLine:6});
      cur_pos--;
    }
    if (cur_pos > 0) {
      cmp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[cur_pos-1]:'compare'}, sorted:sortedSet, message:`比較 a_list[${cur_pos-1}]=${a[cur_pos-1]} 與 cur_val=${cur_val}：${a[cur_pos-1]} ≤ ${cur_val}，停止位移`, stats:{cmp,sft,key:cur_val}, pcLine:5});
    }
    a[cur_pos] = cur_val;
    oi[cur_pos] = oiKey;
    frames.push({arr:[...a], origIdx:[...oi], highlights:{[cur_pos]:'sorted'}, sorted:range(0, i+1), message:`把 cur_val=${cur_val} 插入 a_list[${cur_pos}]`, stats:{cmp,sft,key:cur_val}, pcLine:8});
  }
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！${cmp} 次比較、${sft} 次位移`, stats:{cmp,sft,key:'—'}, pcLine:1});
  return frames;
}

// --- Shell Sort ---
function genShellSort(initial, gapSeq) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, swp = 0;
  let gaps;
  if (gapSeq === '2k-1') {
    // Hibbard 序列：2^k − 1 = 1, 3, 7, 15, 31, ... 從最大可用值往下用
    gaps = [];
    let k = 1;
    while ((1 << k) - 1 <= N) k++;
    for (let i = k - 1; i >= 1; i--) gaps.push((1 << i) - 1);
  } else {
    gaps = [];
    let g = Math.floor(N / 2);
    while (g > 0) { gaps.push(g); g = Math.floor(g / 2); }
  }
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:`gap 序列：${gaps.join(' → ')}`, stats:{cmp,swp,gap:'—'}, pcLine:2});
  for (const gap of gaps) {
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:`▸ 開始 gap = ${gap} 階段`, stats:{cmp,swp,gap}, pcLine:3});
    for (let i = gap; i < N; i++) {
      const key = a[i];
      const oiKey = oi[i];
      let pos = i;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[i]:'key'}, message:`gap=${gap}: 取出 key = a[${i}] = ${key}，與 a[${i-gap}], a[${i-2*gap}], ... 比較`, stats:{cmp,swp,gap}, pcLine:5});
      while (pos >= gap && a[pos-gap] > key) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[pos-gap]:'compare',[pos]:'key'}, message:`比較 a[${pos-gap}]=${a[pos-gap]} > key=${key}，要位移`, stats:{cmp,swp,gap}, pcLine:6});
        a[pos] = a[pos-gap];
        oi[pos] = oi[pos-gap];
        swp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[pos]:'swap'}, message:`位移 a[${pos-gap}] → a[${pos}] (跨 ${gap} 格)`, stats:{cmp,swp,gap}, pcLine:7});
        pos -= gap;
      }
      if (pos >= gap) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[pos-gap]:'compare'}, message:`a[${pos-gap}]=${a[pos-gap]} ≤ key=${key}，停止`, stats:{cmp,swp,gap}, pcLine:6});
      }
      a[pos] = key;
      oi[pos] = oiKey;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[pos]:'sorted'}, message:`插入 key=${key} 至 a[${pos}]`, stats:{cmp,swp,gap}, pcLine:9});
    }
  }
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！${cmp} 次比較、${swp} 次位移`, stats:{cmp,swp,gap:'—'}, pcLine:1});
  return frames;
}

// --- Merge Sort ---
function genMergeSort(initial) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, wr = 0;
  const treeNodes = []; // {level, from, to, status}
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:'初始：呼叫 merge_sort(0, n-1)', stats:{cmp,wr,phase:'初始化'}, brackets:[{from:0,to:N-1,row:0,label:`[0..${N-1}]`}], tree:[{level:0,from:0,to:N-1,status:'active'}], pcLine:1});

  function snapshotTree(extras) {
    return treeNodes.map(n => ({...n, status: extras[`${n.from}-${n.to}`] || n.status}));
  }

  function mergeSortHelper(lo, hi, level) {
    if (lo >= hi) {
      treeNodes.push({level, from:lo, to:hi, status:'done'});
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    treeNodes.push({level, from:lo, to:hi, status:'splitting'});
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:`split [${lo}..${hi}] → [${lo}..${mid}] | [${mid+1}..${hi}]`, stats:{cmp,wr,phase:`split level ${level}`}, brackets:[{from:lo,to:mid,row:Math.min(level,4),label:'L',cls:'left'},{from:mid+1,to:hi,row:Math.min(level,4),label:'R',cls:'right'}], tree:[...treeNodes], pcLine:3});

    mergeSortHelper(lo, mid, level + 1);
    mergeSortHelper(mid + 1, hi, level + 1);

    // Merge step
    const Lvals = a.slice(lo, mid + 1);
    const Loi = oi.slice(lo, mid + 1);
    const Rvals = a.slice(mid + 1, hi + 1);
    const Roi = oi.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:`▸ 開始合併 L=[${Lvals.join(',')}] 與 R=[${Rvals.join(',')}]`, stats:{cmp,wr,phase:`merge ${lo}..${hi}`}, brackets:[{from:lo,to:mid,row:0,label:'L',cls:'left'},{from:mid+1,to:hi,row:0,label:'R',cls:'right'}], tree:snapshotTree({[`${lo}-${hi}`]:'merging'}), pcLine:7});
    while (i < Lvals.length && j < Rvals.length) {
      cmp++;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[lo+i]:'compare',[mid+1+j]:'compare'}, message:`比較 L[${i}]=${Lvals[i]} vs R[${j}]=${Rvals[j]}`, stats:{cmp,wr,phase:`merge ${lo}..${hi}`}, brackets:[{from:lo,to:mid,row:0,label:'L',cls:'left'},{from:mid+1,to:hi,row:0,label:'R',cls:'right'}], tree:snapshotTree({[`${lo}-${hi}`]:'merging'}), pcLine:10});
      if (Lvals[i] <= Rvals[j]) {
        a[k] = Lvals[i];
        oi[k] = Loi[i];
        wr++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[k]:'swap'}, message:`L[${i}]=${Lvals[i]} ≤ R[${j}]=${Rvals[j]} → 寫入 a[${k}] = ${Lvals[i]}`, stats:{cmp,wr,phase:`merge ${lo}..${hi}`}, brackets:[{from:lo,to:mid,row:0,label:'L',cls:'left'},{from:mid+1,to:hi,row:0,label:'R',cls:'right'}], tree:snapshotTree({[`${lo}-${hi}`]:'merging'}), pcLine:11});
        i++;
      } else {
        a[k] = Rvals[j];
        oi[k] = Roi[j];
        wr++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[k]:'swap'}, message:`L[${i}]=${Lvals[i]} > R[${j}]=${Rvals[j]} → 寫入 a[${k}] = ${Rvals[j]}`, stats:{cmp,wr,phase:`merge ${lo}..${hi}`}, brackets:[{from:lo,to:mid,row:0,label:'L',cls:'left'},{from:mid+1,to:hi,row:0,label:'R',cls:'right'}], tree:snapshotTree({[`${lo}-${hi}`]:'merging'}), pcLine:13});
        j++;
      }
      k++;
    }
    while (i < Lvals.length) {
      a[k] = Lvals[i]; oi[k] = Loi[i]; wr++; k++; i++;
    }
    while (j < Rvals.length) {
      a[k] = Rvals[j]; oi[k] = Roi[j]; wr++; k++; j++;
    }
    treeNodes.find(n => n.from === lo && n.to === hi).status = 'done';
    frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(lo, hi+1), message:`✓ [${lo}..${hi}] 合併完成 → [${a.slice(lo,hi+1).join(',')}]`, stats:{cmp,wr,phase:`merged ${lo}..${hi}`}, brackets:[{from:lo,to:hi,row:0,label:`done`,cls:'merging'}], tree:[...treeNodes], pcLine:14});
  }

  mergeSortHelper(0, N - 1, 0);
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！${cmp} 次比較、${wr} 次寫入`, stats:{cmp,wr,phase:'完成'}, tree:[...treeNodes], pcLine:1});
  return frames;
}

// --- Quick Sort ---
function genQuickSort(initial, pivotMode) {
  const frames = [];
  const a = [...initial];
  const N = a.length;
  const oi = a.map((_,i)=>i);
  let cmp = 0, swp = 0;
  const finalSorted = new Set();
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, message:'初始：呼叫 quick_sort(0, n-1)', stats:{cmp,swp,pivot:'—',rangeStr:`[0..${N-1}]`,lm:'—',rm:'—'}, brackets:[{from:0,to:N-1,row:0,label:`[0..${N-1}]`}], pcLine:1});

  function partition(first, last) {
    let pivotIdx = first;
    if (pivotMode === 'median' && last - first >= 2) {
      const mid = Math.floor((first + last) / 2);
      const candidates = [{i:first, v:a[first]}, {i:mid, v:a[mid]}, {i:last, v:a[last]}].sort((x,y) => x.v - y.v);
      pivotIdx = candidates[1].i;
      frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'compare',[mid]:'compare',[last]:'compare'}, message:`三者取中：a[${first}]=${a[first]}, a[${mid}]=${a[mid]}, a[${last}]=${a[last]} → 中位數是 a[${pivotIdx}]=${a[pivotIdx]}`, stats:{cmp,swp,pivot:a[pivotIdx],rangeStr:`[${first}..${last}]`,lm:'—',rm:'—'}, brackets:[{from:first,to:last,row:0,label:`partition`}], pcLine:2, sorted:[...finalSorted]});
      if (pivotIdx !== first) {
        [a[first], a[pivotIdx]] = [a[pivotIdx], a[first]];
        [oi[first], oi[pivotIdx]] = [oi[pivotIdx], oi[first]];
        swp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot'}, message:`把中位數搬到 a[${first}]`, stats:{cmp,swp,pivot:a[first],rangeStr:`[${first}..${last}]`,lm:'—',rm:'—'}, brackets:[{from:first,to:last,row:0,label:`partition`}], pcLine:2, sorted:[...finalSorted]});
      }
    }
    const pivot = a[first];
    let L = first + 1, R = last;
    frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`pivot = a[${first}] = ${pivot}，初始 L = ${L}, R = ${R}`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0,label:`partition`}], pcLine:3, sorted:[...finalSorted]});

    let done = false;
    while (!done) {
      while (L <= R && a[L] <= pivot) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot',[L]:'compare'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`a[L=${L}]=${a[L]} ≤ pivot=${pivot} → L 右移`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:6, sorted:[...finalSorted]});
        L++;
      }
      if (L <= R) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot',[L]:'compare'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`a[L=${L}]=${a[L]} > pivot=${pivot} → L 停下`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:6, sorted:[...finalSorted]});
      }
      while (L <= R && a[R] >= pivot) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot',[R]:'compare'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`a[R=${R}]=${a[R]} ≥ pivot=${pivot} → R 左移`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:8, sorted:[...finalSorted]});
        R--;
      }
      if (L <= R) {
        cmp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot',[R]:'compare'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`a[R=${R}]=${a[R]} < pivot=${pivot} → R 停下`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:8, sorted:[...finalSorted]});
      }
      if (R < L) {
        done = true;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`R(${R}) < L(${L})，停止迴圈`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:11, sorted:[...finalSorted]});
      } else {
        [a[L], a[R]] = [a[R], a[L]];
        [oi[L], oi[R]] = [oi[R], oi[L]];
        swp++;
        frames.push({arr:[...a], origIdx:[...oi], highlights:{[first]:'pivot',[L]:'swap',[R]:'swap'}, pointers:{lm:{idx:L,label:'L',cls:'left-mark'},rm:{idx:R,label:'R',cls:'right-mark'}}, message:`交換 a[${L}] ↔ a[${R}]`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:L,rm:R}, brackets:[{from:first,to:last,row:0}], pcLine:13, sorted:[...finalSorted]});
      }
    }
    [a[first], a[R]] = [a[R], a[first]];
    [oi[first], oi[R]] = [oi[R], oi[first]];
    swp++;
    finalSorted.add(R);
    frames.push({arr:[...a], origIdx:[...oi], highlights:{[R]:'sorted'}, message:`pivot 與 a[R=${R}] 交換 → pivot 歸位 a[${R}] = ${pivot}`, stats:{cmp,swp,pivot,rangeStr:`[${first}..${last}]`,lm:'—',rm:'—'}, brackets:[{from:first,to:last,row:0}], pcLine:14, sorted:[...finalSorted]});
    return R;
  }

  function quickHelper(first, last) {
    if (first >= last) {
      if (first === last) finalSorted.add(first);
      return;
    }
    const split = partition(first, last);
    quickHelper(first, split - 1);
    quickHelper(split + 1, last);
  }
  quickHelper(0, N - 1);
  for (let i = 0; i < N; i++) finalSorted.add(i);
  frames.push({arr:[...a], origIdx:[...oi], highlights:{}, sorted:range(0, N), message:`★ 排序完成！${cmp} 次比較、${swp} 次交換`, stats:{cmp,swp,pivot:'—',rangeStr:'—',lm:'—',rm:'—'}, pcLine:1});
  return frames;
}


/* ============================================================
   GENERIC WIRING HELPER FOR FRAME-BASED ALGORITHM SECTIONS
   ============================================================ */
function wireSection(prefix, opts) {
  // canvas IDs follow pattern "canvas-<short>"; allow opts.canvasId override
  const canvas = $(opts.canvasId || ('canvas-' + prefix));
  if (!canvas) { console.warn('Canvas not found for prefix', prefix); return null; }

  const playBtn  = $(prefix + 'Play');
  const stepBtn  = $(prefix + 'Step');
  const resetBtn = $(prefix + 'Reset');
  const speed    = $(prefix + 'Speed');
  const status   = $(prefix + 'Status');
  const codeEl   = $(prefix + 'Code');

  const vis = new BarVis(canvas);
  vis.setData(opts.initialArr);

  const animator = new Animator({
    onFrame: (frame, i) => {
      vis.applyFrame(frame);
      vis.lastFrame = frame;
      if (frame.message) status.textContent = frame.message;
      if (opts.renderStats) opts.renderStats(frame.stats || {});
      // pseudo-code highlight
      if (codeEl) {
        codeEl.querySelectorAll('.line').forEach(ln => ln.classList.remove('active'));
        if (frame.pcLine != null) {
          const ln = codeEl.querySelector(`.line[data-l="${frame.pcLine}"]`);
          if (ln) ln.classList.add('active');
        }
      }
      // tree (merge sort)
      if (opts.renderTree && frame.tree) opts.renderTree(frame.tree);
      // play button label
      if (playBtn) playBtn.textContent = animator.playing ? '⏸ 暫停' : '▶ 開始';
    },
    onEnd: () => { if (playBtn) playBtn.textContent = '▶ 重播'; },
    getDelay: () => speed ? +speed.value : 500
  });

  function regen() {
    const arr = opts.getArr();
    vis.setData(arr);
    const frames = opts.gen(arr);
    animator.setFrames(frames);
    if (playBtn) playBtn.textContent = '▶ 開始';
  }

  if (playBtn) playBtn.onclick = () => {
    if (animator.playing) { animator.pause(); playBtn.textContent = '▶ 繼續'; }
    else { animator.play(); playBtn.textContent = '⏸ 暫停'; }
  };
  if (stepBtn)  stepBtn.onclick  = () => { animator.step(); if (playBtn) playBtn.textContent = '▶ 繼續'; };
  if (resetBtn) resetBtn.onclick = () => { animator.reset(); if (playBtn) playBtn.textContent = '▶ 開始'; };

  // The canvas is often width 0 at the moment we ran setData() (output cell
  // hadn't been laid out yet). Re-layout once the browser has measured it,
  // and keep reacting to later size changes.
  function relayout() { if (canvas.clientWidth > 0) vis.resize(); }
  requestAnimationFrame(() => { relayout(); setTimeout(relayout, 80); setTimeout(relayout, 250); });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(relayout).observe(canvas);
  }

  return { vis, animator, regen };
}

/* ============================================================
   SECTION INITIALIZERS
   ============================================================ */

// --- 01: Sequential Search ---
function initSeqSearch() {
  const ctx = wireSection('seq', {
    initialArr: parseArr($('seqArrInput').value),
    getArr: () => parseArr($('seqArrInput').value),
    gen: (arr) => genSequentialSearch(arr, parseInt($('seqTarget').value)),
    renderStats: (s) => {
      $('seqCmp').textContent = s.cmp ?? 0;
      $('seqPos').textContent = s.pos ?? '—';
      const r = $('seqResult');
      const res = s.result || '';
      if (res.startsWith('True'))      { r.textContent = '✓ ' + res; r.style.color = 'var(--bar-found)'; }
      else if (res === 'False')        { r.textContent = '✗ False (未找到)'; r.style.color = 'var(--accent)'; }
      else                              { r.textContent = res || '—'; r.style.color = ''; }
    }
  });
  if (!ctx) return;
  $('seqApply').onclick   = () => ctx.regen();
  $('seqArrInput').addEventListener('change', () => ctx.regen());
  $('seqTarget').addEventListener('change', () => ctx.regen());
  ctx.regen();
  return ctx;
}

// --- 02: Binary Search ---
function initBinSearch() {
  const ctx = wireSection('bin', {
    initialArr: parseArr($('binArrInput').value).slice().sort((a,b)=>a-b),
    getArr: () => parseArr($('binArrInput').value).slice().sort((a,b)=>a-b),
    gen: (arr) => genBinarySearch(arr, parseInt($('binTarget').value)),
    renderStats: (s) => {
      $('binCmp').textContent = s.cmp ?? 0;
      $('binLow').textContent  = s.low  ?? '—';
      $('binHigh').textContent = s.high ?? '—';
      $('binMid').textContent  = s.mid  ?? '—';
      const r = $('binResult');
      const res = s.result || '';
      if (res.startsWith('True'))      { r.textContent = '✓ ' + res; r.style.color = 'var(--bar-found)'; }
      else if (res === 'False')        { r.textContent = '✗ False (未找到)'; r.style.color = 'var(--accent)'; }
      else                              { r.textContent = res || '—'; r.style.color = ''; }
    }
  });
  if (!ctx) return;
  $('binApply').onclick = () => {
    // Sort the input visibly
    const sorted = parseArr($('binArrInput').value).slice().sort((a,b)=>a-b);
    $('binArrInput').value = sorted.join(', ');
    ctx.regen();
  };
  $('binArrInput').addEventListener('change', () => ctx.regen());
  $('binTarget').addEventListener('change', () => ctx.regen());
  // sort initial input field
  const init = parseArr($('binArrInput').value).slice().sort((a,b)=>a-b);
  $('binArrInput').value = init.join(', ');
  ctx.regen();
  return ctx;
}

// --- 03: Hashing (interactive, NOT frame-based) ---
function initHashing() {
  const M = 11;
  const wrap = $('hashTable');
  let strategy = 'linear';
  let table = new Array(M).fill(null);    // for linear probing: number or null
  let chain = Array.from({length: M}, () => []); // for chaining: list of numbers per slot
  let highlightSlot = -1;
  let highlightCls = '';
  let probedSlots = []; // recently visited slots
  let opCount = 0;

  function buildTable() {
    wrap.innerHTML = '';
    for (let i = 0; i < M; i++) {
      const slot = document.createElement('div');
      slot.className = 'hash-slot';
      slot.dataset.idx = i;
      const idxEl = document.createElement('div');
      idxEl.className = 'slot-idx';
      idxEl.textContent = i;
      const valEl = document.createElement('div');
      valEl.className = 'slot-val';
      valEl.textContent = '—';
      const chainEl = document.createElement('div');
      chainEl.className = 'hash-chain';
      slot.appendChild(idxEl);
      slot.appendChild(valEl);
      slot.appendChild(chainEl);
      slot.classList.add('empty');
      wrap.appendChild(slot);
    }
  }

  function refresh() {
    const slots = wrap.children;
    for (let i = 0; i < M; i++) {
      const slot = slots[i];
      slot.className = 'hash-slot';
      const valEl = slot.querySelector('.slot-val');
      const chainEl = slot.querySelector('.hash-chain');
      chainEl.innerHTML = '';
      if (strategy === 'linear') {
        if (table[i] != null) { valEl.textContent = table[i]; }
        else { valEl.textContent = '—'; slot.classList.add('empty'); }
      } else {
        // chain
        if (chain[i].length === 0) { valEl.textContent = '—'; slot.classList.add('empty'); }
        else {
          valEl.textContent = chain[i][0];
          for (let k = 1; k < chain[i].length; k++) {
            const node = document.createElement('div');
            node.className = 'chain-node';
            node.textContent = chain[i][k];
            chainEl.appendChild(node);
          }
        }
      }
      // apply highlight
      if (probedSlots.includes(i)) slot.classList.add('searching');
    }
    if (highlightSlot >= 0 && highlightCls) {
      slots[highlightSlot].classList.remove('empty','searching');
      slots[highlightSlot].classList.add(highlightCls);
    }
    // stats
    let used;
    if (strategy === 'linear') used = table.filter(x => x != null).length;
    else used = chain.reduce((s, c) => s + (c.length > 0 ? 1 : 0), 0);
    $('hashUsed').textContent = `${used} / ${M}`;
    let load;
    if (strategy === 'linear') load = used / M;
    else load = chain.reduce((s,c)=>s+c.length,0) / M;
    $('hashLoad').textContent = load.toFixed(2);
    $('hashOps').textContent = opCount;
  }

  function setStatus(msg) { $('hashStatus').textContent = msg; }

  function clearHighlights() {
    highlightSlot = -1; highlightCls = ''; probedSlots = [];
  }

  async function animate(steps) {
    for (const s of steps) {
      Object.assign({highlightSlot, highlightCls, probedSlots}, s);
      if ('highlightSlot' in s) highlightSlot = s.highlightSlot;
      if ('highlightCls' in s) highlightCls = s.highlightCls;
      if ('probedSlots' in s) probedSlots = s.probedSlots;
      if ('msg' in s) setStatus(s.msg);
      if ('table' in s) table = s.table;
      if ('chain' in s) chain = s.chain;
      refresh();
      await new Promise(r => setTimeout(r, 600));
    }
  }

  async function insert(val) {
    if (isNaN(val)) return;
    opCount = 0;
    clearHighlights();
    const h = ((val % M) + M) % M;
    if (strategy === 'linear') {
      const probed = [];
      let i = h;
      let steps = 0;
      while (steps < M) {
        opCount++;
        probed.push(i);
        if (table[i] == null) {
          await animate([
            {msg: `h(${val}) = ${val} mod ${M} = ${h}，probe slot ${i}`, highlightSlot: i, highlightCls: 'searching', probedSlots: [...probed]},
            {msg: `slot ${i} 為空 → 插入 ${val}`, highlightSlot: i, highlightCls: 'placed', probedSlots: probed.slice(0,-1), table: (() => { const t=[...table]; t[i]=val; return t; })()}
          ]);
          return;
        }
        if (table[i] === val) {
          await animate([{msg: `slot ${i} 已是 ${val}（重複）`, highlightSlot: i, highlightCls: 'collision', probedSlots: probed}]);
          return;
        }
        await animate([{msg: `slot ${i} 被 ${table[i]} 佔用 → 線性探查下一個`, highlightSlot: i, highlightCls: 'collision', probedSlots: [...probed]}]);
        i = (i + 1) % M;
        steps++;
      }
      setStatus('表已滿，無法插入');
    } else {
      // chain
      opCount++;
      const c = [...chain[h]];
      if (c.includes(val)) {
        await animate([{msg: `slot ${h} 的鏈結串列已含 ${val}（重複）`, highlightSlot: h, highlightCls: 'collision'}]);
        return;
      }
      const newChain = chain.map((x,idx) => idx === h ? [...x, val] : x);
      await animate([
        {msg: `h(${val}) = ${h}，插入 slot ${h} 的鏈結串列`, highlightSlot: h, highlightCls: 'searching'},
        {msg: `slot ${h} 已加入 ${val}（鏈長 ${newChain[h].length}）`, highlightSlot: h, highlightCls: 'placed', chain: newChain}
      ]);
    }
  }

  async function search(val) {
    if (isNaN(val)) return;
    opCount = 0;
    clearHighlights();
    const h = ((val % M) + M) % M;
    if (strategy === 'linear') {
      let i = h;
      let steps = 0;
      const probed = [];
      while (steps < M) {
        opCount++;
        probed.push(i);
        if (table[i] == null) {
          await animate([{msg: `slot ${i} 為空 → 找不到 ${val}`, highlightSlot: i, highlightCls: 'collision', probedSlots: probed.slice(0,-1)}]);
          return;
        }
        if (table[i] === val) {
          await animate([{msg: `✓ 在 slot ${i} 找到 ${val}！比較了 ${opCount} 次`, highlightSlot: i, highlightCls: 'found', probedSlots: probed.slice(0,-1)}]);
          return;
        }
        await animate([{msg: `slot ${i} = ${table[i]} ≠ ${val}，繼續探查`, highlightSlot: i, highlightCls: 'searching', probedSlots: [...probed]}]);
        i = (i + 1) % M;
        steps++;
      }
      setStatus(`找不到 ${val}（已掃過整個表）`);
    } else {
      const c = chain[h];
      for (let k = 0; k < c.length; k++) {
        opCount++;
        if (c[k] === val) {
          await animate([{msg: `✓ 在 slot ${h} 鏈結串列第 ${k+1} 位找到 ${val}（比較 ${opCount} 次）`, highlightSlot: h, highlightCls: 'found'}]);
          return;
        }
      }
      opCount = Math.max(opCount, 1);
      await animate([{msg: `slot ${h} 的鏈結串列中沒有 ${val}`, highlightSlot: h, highlightCls: 'collision'}]);
    }
  }

  buildTable();
  refresh();

  $('hashInsert').onclick = () => insert(parseInt($('hashVal').value));
  $('hashSearch').onclick = () => search(parseInt($('hashVal').value));
  $('hashClear').onclick = () => {
    table = new Array(M).fill(null);
    chain = Array.from({length: M}, () => []);
    opCount = 0;
    clearHighlights();
    refresh();
    setStatus('已清空雜湊表');
  };
  $('hashBatchInsert').onclick = async () => {
    const arr = parseArr($('hashBatch').value);
    for (const v of arr) {
      await insert(v);
      await new Promise(r => setTimeout(r, 200));
    }
  };
  // strategy buttons
  document.querySelectorAll('#hashing .preset-btn[data-strategy]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#hashing .preset-btn[data-strategy]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      strategy = btn.dataset.strategy;
      // clear table when switching for clarity
      table = new Array(M).fill(null);
      chain = Array.from({length: M}, () => []);
      opCount = 0;
      clearHighlights();
      refresh();
      setStatus(`已切換為「${strategy === 'linear' ? '線性探查' : '鏈結法'}」並清空表`);
    };
  });
}

// --- 04: Bubble Sort ---
function initBubble() {
  const ctx = wireSection('bubble', {
    initialArr: parseArr($('bubbleArrInput').value),
    getArr: () => parseArr($('bubbleArrInput').value),
    gen: (arr) => genBubbleSort(arr),
    renderStats: (s) => {
      $('bubbleCmp').textContent  = s.cmp ?? 0;
      $('bubbleSwp').textContent  = s.swp ?? 0;
      $('bubblePass').textContent = s.pass ?? 0;
    }
  });
  if (!ctx) return;
  $('bubbleApply').onclick   = () => ctx.regen();
  $('bubbleShuffle').onclick = () => {
    const arr = randomArray(10, 99);
    $('bubbleArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('bubbleArrInput').addEventListener('change', () => ctx.regen());
  ctx.regen();
  return ctx;
}

// --- 05: Selection Sort ---
function initSelection() {
  const ctx = wireSection('sel', {
    initialArr: parseArr($('selArrInput').value),
    getArr: () => parseArr($('selArrInput').value),
    gen: (arr) => genSelectionSort(arr),
    renderStats: (s) => {
      $('selCmp').textContent = s.cmp ?? 0;
      $('selSwp').textContent = s.swp ?? 0;
      $('selMinIdx').textContent = s.minIdx ?? '—';
    }
  });
  if (!ctx) return;
  $('selApply').onclick   = () => ctx.regen();
  $('selShuffle').onclick = () => {
    const arr = randomArray(10, 99);
    $('selArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('selArrInput').addEventListener('change', () => ctx.regen());
  ctx.regen();
  return ctx;
}

// --- 06: Insertion Sort ---
function initInsertion() {
  const ctx = wireSection('ins', {
    initialArr: parseArr($('insArrInput').value),
    getArr: () => parseArr($('insArrInput').value),
    gen: (arr) => genInsertionSort(arr),
    renderStats: (s) => {
      $('insCmp').textContent  = s.cmp ?? 0;
      $('insShift').textContent = s.sft ?? 0;
      $('insKey').textContent  = s.key ?? '—';
    }
  });
  if (!ctx) return;
  $('insApply').onclick   = () => ctx.regen();
  $('insShuffle').onclick = () => {
    const arr = randomArray(10, 99);
    $('insArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('insArrInput').addEventListener('change', () => ctx.regen());
  ctx.regen();
  return ctx;
}

// --- 07: Shell Sort ---
function initShell() {
  let gapSeq = 'half';
  const ctx = wireSection('shell', {
    initialArr: parseArr($('shellArrInput').value),
    getArr: () => parseArr($('shellArrInput').value),
    gen: (arr) => genShellSort(arr, gapSeq),
    renderStats: (s) => {
      $('shellCmp').textContent = s.cmp ?? 0;
      $('shellSwp').textContent = s.swp ?? 0;
      $('shellGap').textContent = s.gap ?? '—';
    }
  });
  if (!ctx) return;
  $('shellApply').onclick   = () => ctx.regen();
  $('shellShuffle').onclick = () => {
    const arr = randomArray(10, 99);
    $('shellArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('shellArrInput').addEventListener('change', () => ctx.regen());
  document.querySelectorAll('#shell .preset-btn[data-gap]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#shell .preset-btn[data-gap]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gapSeq = btn.dataset.gap;
      ctx.regen();
    };
  });
  ctx.regen();
  return ctx;
}

// --- 08: Merge Sort ---
function renderMergeTree(treeData) {
  const treeEl = $('mergeTree');
  if (!treeEl) return;
  treeEl.innerHTML = '';
  // group by level
  const byLevel = {};
  for (const n of treeData) {
    if (!byLevel[n.level]) byLevel[n.level] = [];
    byLevel[n.level].push(n);
  }
  const levels = Object.keys(byLevel).map(Number).sort((a,b)=>a-b);
  for (const lv of levels) {
    const row = document.createElement('div');
    row.className = 'tree-row';
    // sort nodes left-to-right
    byLevel[lv].sort((a,b)=>a.from - b.from);
    for (const n of byLevel[lv]) {
      const node = document.createElement('div');
      node.className = 'tree-node';
      if (n.status === 'splitting' || n.status === 'active') node.classList.add('active');
      else if (n.status === 'merging') node.classList.add('merging');
      else if (n.status === 'done') node.classList.add('done');
      node.textContent = n.from === n.to ? `[${n.from}]` : `[${n.from}..${n.to}]`;
      row.appendChild(node);
    }
    treeEl.appendChild(row);
  }
}

function initMerge() {
  const ctx = wireSection('merge', {
    initialArr: parseArr($('mergeArrInput').value),
    getArr: () => parseArr($('mergeArrInput').value),
    gen: (arr) => genMergeSort(arr),
    renderStats: (s) => {
      $('mergeCmp').textContent   = s.cmp ?? 0;
      $('mergeWrite').textContent = s.wr ?? 0;
      $('mergePhase').textContent = s.phase ?? '—';
    },
    renderTree: renderMergeTree
  });
  if (!ctx) return;
  $('mergeApply').onclick   = () => ctx.regen();
  $('mergeShuffle').onclick = () => {
    const arr = randomArray(8, 99);
    $('mergeArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('mergeArrInput').addEventListener('change', () => ctx.regen());
  ctx.regen();
  return ctx;
}

// --- 09: Quick Sort ---
function initQuick() {
  let pivotMode = 'first';
  const ctx = wireSection('quick', {
    initialArr: parseArr($('quickArrInput').value),
    getArr: () => parseArr($('quickArrInput').value),
    gen: (arr) => genQuickSort(arr, pivotMode),
    renderStats: (s) => {
      $('quickCmp').textContent   = s.cmp ?? 0;
      $('quickSwp').textContent   = s.swp ?? 0;
      $('quickPivot').textContent = (s.pivot != null && s.pivot !== '—') ? s.pivot : '—';
      $('quickRange').textContent = s.rangeStr ?? '—';
      $('quickLM').textContent    = s.lm ?? '—';
      $('quickRM').textContent    = s.rm ?? '—';
    }
  });
  if (!ctx) return;
  $('quickApply').onclick   = () => ctx.regen();
  $('quickShuffle').onclick = () => {
    const arr = randomArray(9, 99);
    $('quickArrInput').value = arr.join(', ');
    ctx.regen();
  };
  $('quickArrInput').addEventListener('change', () => ctx.regen());
  document.querySelectorAll('#quick .preset-btn[data-pivot]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#quick .preset-btn[data-pivot]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pivotMode = btn.dataset.pivot;
      ctx.regen();
    };
  });
  ctx.regen();
  return ctx;
}



  // ---- expose namespace ----
  const allContexts = [];
  function _push(c) { if (c) allContexts.push(c); return c; }

  window.DS07 = {
    init: {
      seq:       function(){ return _push(initSeqSearch()); },
      bin:       function(){ return _push(initBinSearch()); },
      hash:      function(){ initHashing(); },
      bubble:    function(){ return _push(initBubble()); },
      selection: function(){ return _push(initSelection()); },
      insertion: function(){ return _push(initInsertion()); },
      shell:     function(){ return _push(initShell()); },
      merge:     function(){ return _push(initMerge()); },
      quick:     function(){ return _push(initQuick()); }
    }
  };

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      for (const ctx of allContexts) { if (ctx && ctx.vis) ctx.vis.resize(); }
    }, 150);
  });
})();
