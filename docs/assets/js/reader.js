let fs = 19;
const BOOK_ID = document.body.dataset.book || 'default';
const SCROLL_KEY = 'jp-scroll:' + BOOK_ID;
const THEME_KEY = 'jp-theme-dark';
function stepFont(d) {
  fs = Math.min(30, Math.max(13, fs + d * 1.5));
  document.documentElement.style.setProperty('--fs', fs + 'px');
}
function toggleRuby() {
  const on = document.body.classList.toggle('no-ruby') === false;
  document.getElementById('rubyBtn').classList.toggle('on', on);
}
function toggleTheme() { document.body.classList.toggle('dark'); }
(function () {
  let t = null;
  addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      localStorage.setItem(SCROLL_KEY, scrollY);
      const max = document.documentElement.scrollHeight - innerHeight;
      localStorage.setItem('jp-progress:' + BOOK_ID, String(max > 0 ? Math.min(1, scrollY / max) : 0));
      localStorage.setItem('jp-last:' + BOOK_ID, String(Date.now()));
    }, 300);
  });
  const y = localStorage.getItem(SCROLL_KEY) || localStorage.getItem('jp-book-scroll');
  if (y) setTimeout(() => scrollTo(0, +y), 60);
  const darkSaved = localStorage.getItem(THEME_KEY) !== null
    ? localStorage.getItem(THEME_KEY)
    : localStorage.getItem('jp-book-scroll-dark');
  if (darkSaved === '1') document.body.classList.add('dark');
  const orig = toggleTheme;
  toggleTheme = function () {
    orig();
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? '1' : '0');
  };
})();

/* ---------- 朗读（Web Speech API，建议用 Edge 打开以获得日语自然音色） ---------- */
const TTS = (() => {
  if (!('speechSynthesis' in window)) {
    return {
      playPause() { }, stop() { }, prev() { }, next() { },
      replay() { }, clearRange() { }, togglePanel() { }
    };
  }
  const synth = speechSynthesis;
  const playBtn = document.getElementById('ttsPlayBtn');
  const voiceSel = document.getElementById('ttsVoice');
  const rateEl = document.getElementById('ttsRate');
  const rateVal = document.getElementById('ttsRateVal');
  const repeatSel = document.getElementById('ttsRepeat');
  const startInfo = document.getElementById('ttsStartInfo');
  const endInfo = document.getElementById('ttsEndInfo');
  const panel = document.getElementById('ttsPanel');
  const Q_OPEN = '「『（(“';
  const Q_CLOSE = '」』）)”';
  const STOP = '。！？!?';
  const MAX_QUOTE_UNIT = 80;   // 引号内句子短于此长度时整段视为一句
  const CHUNK_SECONDS = 10;    // 单个语音片段的目标时长
  const CHAR_PER_SEC = 6;      // 1 倍速下日文大致语速（字/秒）

  let queue = [];
  let idx = 0;
  let hlIdx = -1;      // 已高亮的句子下标，-1 表示无
  let state = 'idle';  // idle | playing | paused
  let gen = 0;         // 每次重新发声自增，用于丢弃 cancel 后迟到的回调
  let repDone = 0;     // 当前句已读完的遍数
  let curChunks = [];  // 当前句切出的语音片段
  let curChunk = 0;    // 当前片段下标
  let startIdx = null; // 朗读起点（含）
  let endIdx = null;   // 朗读终点（含），null 表示读到书末
  let wraps = [];
  let rubyHls = [];

  function inRt(node) {
    for (let p = node.parentNode; p; p = p.parentNode) {
      if (p.nodeName === 'RT' || p.nodeName === 'RP') return true;
    }
    return false;
  }
  function textNodesOf(el) {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => inRt(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n);
    return out;
  }

  function sentenceRanges(text) {
    const out = [];
    const stack = [];
    let last = 0;
    let i = 0;
    const n = text.length;
    while (i < n) {
      const c = text[i];
      if (Q_OPEN.includes(c)) { stack.push(i); i++; continue; }
      if (Q_CLOSE.includes(c)) {
        if (stack.length) stack.pop();
        if (!stack.length) {
          let j = i + 1;
          while (j < n && Q_CLOSE.includes(text[j])) j++;
          if (j >= n || Q_OPEN.includes(text[j])) { out.push([last, j]); last = j; i = j; continue; }
        }
        i++; continue;
      }
      if (STOP.includes(c)) {
        if (stack.length && i - stack[stack.length - 1] < MAX_QUOTE_UNIT) { i++; continue; }
        let j = i + 1;
        while (j < n && STOP.includes(text[j])) j++;
        if (!stack.length) while (j < n && Q_CLOSE.includes(text[j])) j++;
        out.push([last, j]); last = j; i = j; continue;
      }
      i++;
    }
    if (last < n) out.push([last, n]);
    return out;
  }

  function buildQueue() {
    queue = [];
    let g = 0;
    document.querySelectorAll('h2, p').forEach(el => {
      const text = textNodesOf(el).map(n => n.nodeValue).join('');
      for (const [s, e] of sentenceRanges(text)) {
        const raw = text.slice(s, e);
        const t = raw.trim();
        if (!t) continue;
        const lead = raw.length - raw.trimStart().length;
        const start = s + lead;
        queue.push({
          el, start, end: start + t.length, text: t,
          gStart: g + start, gEnd: g + start + t.length
        });
      }
      g += text.length;
    });
  }

  function clearHL() {
    for (const s of wraps) {
      const parent = s.parentNode;
      if (!parent) continue;
      while (s.firstChild) parent.insertBefore(s.firstChild, s);
      parent.removeChild(s);
      parent.normalize();
    }
    for (const r of rubyHls) r.classList.remove('tts-hl');
    wraps = [];
    rubyHls = [];
  }

  function highlight(item) {
    clearHL();
    const nodes = textNodesOf(item.el);
    let pos = 0;
    for (const node of nodes) {
      const len = node.nodeValue.length;
      const nodeStart = pos;
      pos += len;
      const s = Math.max(item.start, nodeStart) - nodeStart;
      const e = Math.min(item.end, pos) - nodeStart;
      if (s >= e) continue;
      if (node.parentNode.nodeName === 'RUBY') {
        node.parentNode.classList.add('tts-hl');
        rubyHls.push(node.parentNode);
        continue;
      }
      let target = node;
      if (e < len) target.splitText(e);
      if (s > 0) target = target.splitText(s);
      const span = document.createElement('span');
      span.className = 'tts-hl';
      target.parentNode.insertBefore(span, target);
      span.appendChild(target);
      wraps.push(span);
    }
    const first = wraps[0] || rubyHls[0];
    if (first) {
      const r = first.getBoundingClientRect();
      if (r.top < 80 || r.bottom > innerHeight - 100) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }

  function currentVoice() {
    const uri = voiceSel.value;
    return synth.getVoices().find(v => v.voiceURI === uri) || null;
  }

  function repeatCount() {
    const n = parseInt(repeatSel.value, 10);
    return n > 0 ? n : 1;
  }

  function finish() {
    state = 'idle';
    gen++;
    idx = startIdx == null ? 0 : startIdx;
    repDone = 0;
    hlIdx = -1;
    clearHL();
    updateBtn();
  }

  function chunkLen() {
    const rate = parseFloat(rateEl.value) || 1;
    return Math.max(24, Math.min(120, Math.round(CHUNK_SECONDS * CHAR_PER_SEC * rate)));
  }

  function chunkText(text, maxLen) {
    const out = [];
    const breaks = '、，,；;：:';
    let s = 0;
    while (s < text.length) {
      let e = Math.min(text.length, s + maxLen);
      if (e < text.length) {
        const seg = text.slice(s, e);
        let cut = -1;
        for (let k = seg.length - 1; k > maxLen * 0.4; k--) {
          if (breaks.includes(seg[k])) { cut = k; break; }
        }
        if (cut > 0) e = s + cut + 1;
      }
      out.push(text.slice(s, e));
      s = e;
    }
    return out;
  }

  function speak(i) {
    if (i >= queue.length || (endIdx != null && i > endIdx)) {
      finish();
      return;
    }
    idx = i;
    if (hlIdx !== i) { highlight(queue[i]); hlIdx = i; }
    curChunks = chunkText(queue[i].text, chunkLen());
    curChunk = 0;
    speakChunk();
  }

  function speakChunk() {
    const u = new SpeechSynthesisUtterance(curChunks[curChunk]);
    const v = currentVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'ja-JP'; }
    u.rate = parseFloat(rateEl.value) || 1;
    const g = ++gen;
    u.onend = () => {
      if (state !== 'playing' || g !== gen) return;
      if (curChunk + 1 < curChunks.length) { curChunk++; speakChunk(); return; }
      repDone++;
      if (repDone < repeatCount()) { curChunk = 0; speakChunk(); }
      else { repDone = 0; speak(idx + 1); }
    };
    u.onerror = ev => {
      if (g !== gen || state !== 'playing') return;
      if (ev.error === 'interrupted' || ev.error === 'canceled') return;
      repDone = 0;
      speak(idx + 1);
    };
    synth.speak(u);
  }

  function updateBtn() {
    playBtn.textContent = state === 'playing' ? '❚❚' : '▶';
  }

  function startFrom(i) {
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    idx = Math.max(0, Math.min(i, queue.length - 1));
    if (endIdx != null && idx > endIdx) idx = startIdx == null ? 0 : startIdx;
    repDone = 0;
    state = 'playing';
    synth.cancel();
    gen++;
    const g = gen;
    setTimeout(() => { if (state === 'playing' && g === gen) speak(idx); }, 60);
    updateBtn();
  }

  function playPause() {
    if (state === 'playing') {
      synth.pause();
      state = 'paused';
    } else if (state === 'paused') {
      state = 'playing';
      synth.resume();
    } else {
      startFrom(idx);
      return;
    }
    updateBtn();
  }

  function stop() {
    state = 'idle';
    gen++;
    repDone = 0;
    synth.cancel();
    clearHL();
    hlIdx = -1;
    updateBtn();
  }

  function jump(delta) {
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    let i = Math.max(0, Math.min(queue.length - 1, idx + delta));
    if (startIdx != null && i < startIdx) i = startIdx;
    if (endIdx != null && i > endIdx) i = endIdx;
    repDone = 0;
    if (state === 'idle') { idx = i; highlight(queue[i]); hlIdx = i; }
    else startFrom(i);
  }

  function replay() { startFrom(idx); }

  function snippet(i) {
    const t = queue[i].text;
    const body = t.length > 14 ? t.slice(0, 14) + '…' : t;
    return body.startsWith('「') ? body : '「' + body + '」';
  }

  function markRange() {
    document.querySelectorAll('.tts-start-mark, .tts-end-mark').forEach(el => {
      el.classList.remove('tts-start-mark', 'tts-end-mark');
    });
    if (startIdx != null) queue[startIdx].el.classList.add('tts-start-mark');
    if (endIdx != null) queue[endIdx].el.classList.add('tts-end-mark');
  }

  function updateRangeInfo() {
    startInfo.textContent = startIdx == null ? '未设置' : snippet(startIdx);
    endInfo.textContent = endIdx == null ? '书末' : snippet(endIdx);
    if (queue.length) markRange();
  }

  function clearRange() {
    startIdx = null;
    endIdx = null;
    updateRangeInfo();
  }

  function pointRange(x, y) {
    if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      const r = document.createRange();
      r.setStart(p.offsetNode, p.offset);
      r.collapse(true);
      return r;
    }
    return null;
  }

  function queueIndexAtRange(range) {
    if (!range) return -1;
    let node = range.startContainer;
    let off = range.startOffset;
    if (node.nodeType === 3 && inRt(node)) {
      let p = node.parentNode;
      while (p && p.nodeName !== 'RUBY') p = p.parentNode;
      const base = p && textNodesOf(p)[0];
      if (base) { node = base; off = 0; }
    }
    const el = node.nodeType === 1 ? node : node.parentElement;
    const block = el && el.closest ? el.closest('p, h2') : null;
    if (!block) return -1;
    const nodes = textNodesOf(block);
    let pos = 0;
    if (node.nodeType === 3 && nodes.indexOf(node) !== -1) {
      for (const t of nodes) {
        if (t === node) break;
        pos += t.nodeValue.length;
      }
      pos += off;
    }
    const items = [];
    for (let i = 0; i < queue.length; i++) if (queue[i].el === block) items.push(i);
    if (!items.length) return -1;
    for (const i of items) if (pos >= queue[i].start && pos < queue[i].end) return i;
    for (const i of items) if (queue[i].start >= pos) return i;
    return items[items.length - 1];
  }

  function blockText(el) {
    return textNodesOf(el).map(n => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
  }

  function sentenceAtPoint(x, y) {
    const i = queueIndexAtRange(pointRange(x, y));
    return i >= 0 ? queue[i] : null;
  }

  function explainTarget(x, y) {
    if (!queue.length) buildQueue();
    if (!queue.length) return null;
    let item = null;
    if (x != null && y != null) item = sentenceAtPoint(x, y);
    if (!item && hlIdx >= 0) item = queue[hlIdx];
    if (!item) return null;
    const blocks = Array.from(document.querySelectorAll('h2, p'));
    const bi = blocks.indexOf(item.el);
    return {
      sentence: item.text,
      before: bi > 0 ? blockText(blocks[bi - 1]) : '',
      after: bi >= 0 && bi + 1 < blocks.length ? blockText(blocks[bi + 1]) : ''
    };
  }

  function globalTextOffset(node, off) {
    let total = 0;
    const blocks = document.querySelectorAll('h2, p');
    for (const block of blocks) {
      for (const t of textNodesOf(block)) {
        if (t === node) return total + off;
        total += t.nodeValue.length;
      }
    }
    return -1;
  }

  function boundaryGlobal(node, off) {
    if (node.nodeType === 3 && inRt(node)) {
      let p = node.parentNode;
      while (p && p.nodeName !== 'RUBY') p = p.parentNode;
      const base = p && textNodesOf(p)[0];
      if (base) { node = base; off = 0; }
    }
    if (node.nodeType !== 3) {
      const block = node.closest ? node.closest('p, h2') : null;
      if (!block) return -1;
      const nodes = textNodesOf(block);
      if (!nodes.length) return -1;
      return globalTextOffset(nodes[Math.min(off, nodes.length - 1)], 0);
    }
    return globalTextOffset(node, off);
  }

  function applySelectionRange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    if (!queue.length) buildQueue();
    if (!queue.length) return false;
    const r = sel.getRangeAt(0);
    let gs = boundaryGlobal(r.startContainer, r.startOffset);
    let ge = boundaryGlobal(r.endContainer, r.endOffset);
    if (gs < 0 || ge < 0) return false;
    if (ge < gs) { const t = gs; gs = ge; ge = t; }
    let s = -1;
    for (let i = 0; i < queue.length; i++) { if (queue[i].gEnd > gs) { s = i; break; } }
    if (s < 0) return false;
    let e = s;
    for (let i = queue.length - 1; i >= s; i--) { if (queue[i].gStart < ge) { e = i; break; } }
    startIdx = s;
    endIdx = e;
    idx = s;
    updateRangeInfo();
    if (state === 'playing' || state === 'paused') startFrom(s);
    return true;
  }

  function onDocMouseUp(ev) {
    if (ev.shiftKey) return;
    if (ev.target.closest && ev.target.closest('.toolbar')) return;
    applySelectionRange();
  }

  let downX = 0;
  let downY = 0;
  document.addEventListener('mousedown', ev => { downX = ev.clientX; downY = ev.clientY; });

  function onDocClick(ev) {
    if (!panel.classList.contains('open')) return;
    if (ev.target.closest && ev.target.closest('.toolbar')) return;
    if (Math.abs(ev.clientX - downX) > 5 || Math.abs(ev.clientY - downY) > 5) return; // 拖动选字，不改范围
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    let i = queueIndexAtRange(pointRange(ev.clientX, ev.clientY));
    if (i < 0) return;
    if (ev.shiftKey) {
      if (startIdx != null && i < startIdx) i = startIdx;
      endIdx = i;
    } else {
      startIdx = i;
      idx = i;
      if (endIdx != null && endIdx < startIdx) endIdx = null;
      if (state === 'idle') { highlight(queue[i]); hlIdx = i; }
      else startFrom(i);
    }
    updateRangeInfo();
  }

  function loadVoices() {
    const ja = synth.getVoices().filter(v => /^ja/i.test(v.lang));
    voiceSel.innerHTML = '';
    if (!ja.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = '未找到日语语音（建议用 Edge 打开）';
      voiceSel.appendChild(o);
      return;
    }
    for (const v of ja) {
      const o = document.createElement('option');
      o.value = v.voiceURI;
      o.textContent = v.name + (v.localService ? '' : ' · 在线');
      voiceSel.appendChild(o);
    }
    const saved = localStorage.getItem('jp-tts-voice');
    const chosen = ja.find(v => v.voiceURI === saved)
      || ja.find(v => /nanami|natural|online/i.test(v.name))
      || ja[0];
    voiceSel.value = chosen.voiceURI;
  }

  rateEl.value = localStorage.getItem('jp-tts-rate') || '1';
  const syncRate = () => { rateVal.textContent = parseFloat(rateEl.value); };
  syncRate();
  rateEl.addEventListener('input', () => {
    syncRate();
    localStorage.setItem('jp-tts-rate', rateEl.value);
  });
  repeatSel.value = localStorage.getItem('jp-tts-repeat') || '1';
  if (!repeatSel.value) repeatSel.value = '1';
  repeatSel.addEventListener('change', () => localStorage.setItem('jp-tts-repeat', repeatSel.value));
  voiceSel.addEventListener('change', () => localStorage.setItem('jp-tts-voice', voiceSel.value));
  document.addEventListener('click', onDocClick);
  document.addEventListener('mouseup', onDocMouseUp);
  synth.onvoiceschanged = loadVoices;
  loadVoices();
  setTimeout(loadVoices, 500);
  updateRangeInfo();
  updateBtn();

  return {
    playPause,
    stop,
    prev() { jump(-1); },
    next() { jump(1); },
    replay,
    clearRange,
    getTarget: explainTarget,
    togglePanel() { panel.classList.toggle('open'); }
  };
})();

/* ---------- 句子解析：选中或点击句子，调用本机 Ollama 讲解意思和语法 ---------- */
const EXPLAIN = (() => {
  const SYS = `你是日语精读老师。学生是中文母语的日语学习者，正在读日文原版小说。
学生能看懂基本句型，但常被长句、省略和口语表达卡住。

请只根据给出的原文讲解，不要编造句子里没有的语法或生词。不确定的地方直接说不确定。
输出用中文，纯文本，不要使用 Markdown 符号（不要 #、**、-）。按下面四段输出：

【句意】
先给自然的中文意译，再用「」给一份贴近原文语序的直译（直译要能看出日语原来的语序）。

【语法】
逐条列出句中的语法点、句型和关键助词。每条一行，格式：引用原文片段 —— 接续方式；在这句话里起什么作用。
只列真正影响理解的，通常 2~6 条；句子很简单就少写，不要硬凑。

【语气与语境】
说话人的态度、省略了什么、有什么潜台词；这句在前后文里的作用。

【生词】
只列这段原文里实际出现的、N2 以上或影响理解的词。格式：词（平假名读音）词性 —— 释义。
读音一律用平假名，不要写罗马字；没有就写「无」。`;

  const PROMPT_VERSION = 2;

  const CACHE_KEY = 'jp-explain-cache';
  const CACHE_MAX = 120;
  const TOPIC_MAX = 260;

  const PRESETS = [
    { id: 'ollama', name: 'Ollama 本地（免费）', base: 'http://127.0.0.1:11434', model: 'qwen2.5:7b-instruct', key: false },
    { id: 'deepseek', name: 'DeepSeek（需 Key）', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', key: true },
    { id: 'kimi', name: 'Kimi 月之暗面（需 Key）', base: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', key: true },
    { id: 'qwen', name: '通义千问 DashScope（需 Key）', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', key: true },
    { id: 'silicon', name: 'SiliconFlow 硅基流动（需 Key）', base: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', key: true },
    { id: 'openai', name: 'OpenAI（需 Key）', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', key: true },
    { id: 'custom', name: '自定义', base: '', model: '', key: false }
  ];

  let ui = null;
  let current = null;
  let lastClick = null;
  let lastSel = null;
  let busy = false;
  let ctrl = null;
  let gen = 0;

  const base = () => (localStorage.getItem('jp-ai-base') || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  const model = () => localStorage.getItem('jp-ai-model') || 'qwen2.5:7b-instruct';
  const apiKey = () => localStorage.getItem('jp-ai-key') || '';
  const presetId = () => localStorage.getItem('jp-ai-preset') || 'ollama';
  const preset = () => PRESETS.find(p => p.id === presetId()) || PRESETS[0];
  const needsKey = () => {
    const p = preset();
    return p.key && !apiKey();
  };

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function cacheGet(k) {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const hit = all[k];
      return hit && hit.v ? hit.v : null;
    } catch (e) { return null; }
  }
  function cachePut(k, v) {
    try {
      const all = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      all[k] = { t: Date.now(), v: v };
      const keys = Object.keys(all);
      if (keys.length > CACHE_MAX) {
        keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0));
        keys.slice(0, keys.length - CACHE_MAX).forEach(x => delete all[x]);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(all));
    } catch (e) { /* 存不下就放弃缓存，不影响解析 */ }
  }

  function inRt(node) {
    for (let p = node.parentNode; p; p = p.parentNode) {
      if (p.nodeName === 'RT' || p.nodeName === 'RP') return true;
    }
    return false;
  }
  function blockText(el) {
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: n => inRt(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n.nodeValue);
    return out.join('').replace(/\s+/g, ' ').trim();
  }
  function blockOf(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return el && el.closest ? el.closest('p, h2') : null;
  }
  function selectionInput() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
    const r = sel.getRangeAt(0);
    const box = document.createElement('div');
    box.appendChild(r.cloneContents());
    box.querySelectorAll('rt, rp').forEach(n => n.remove());
    const sentence = (box.textContent || '').replace(/\s+/g, ' ').trim();
    if (sentence.length < 2) return null;
    const block = blockOf(r.startContainer) || blockOf(r.endContainer);
    if (!block) return null;
    const blocks = Array.from(document.querySelectorAll('h2, p'));
    const i = blocks.indexOf(block);
    return {
      sentence: sentence,
      before: i > 0 ? blockText(blocks[i - 1]) : '',
      after: i >= 0 && i + 1 < blocks.length ? blockText(blocks[i + 1]) : ''
    };
  }
  function resolveTarget() {
    const sel = selectionInput() || lastSel;
    if (sel) return sel;
    if (lastClick) {
      const t = TTS.getTarget(lastClick.x, lastClick.y);
      if (t) return t;
    }
    return TTS.getTarget();
  }

  function clip(s, n, fromEnd) {
    s = (s || '').trim();
    if (!s || s.length <= n) return s;
    return fromEnd ? '…' + s.slice(-n) : s.slice(0, n) + '…';
  }
  function buildPrompt(t) {
    const before = clip(t.before, TOPIC_MAX, true);
    const after = clip(t.after, TOPIC_MAX, false);
    return '【上文】\n' + (before || '（无）') +
      '\n\n【要讲解的句子】\n' + t.sentence +
      '\n\n【下文】\n' + (after || '（无）');
  }

  function makeUI() {
    const css = document.createElement('style');
    css.textContent = `
.ai-panel{position:fixed;top:0;right:0;bottom:0;width:clamp(320px,42vw,420px);z-index:30;display:flex;
  flex-direction:column;background:var(--bg);color:var(--fg);border-left:1px solid #d8d1c3;
  box-shadow:-8px 0 30px rgba(0,0,0,.14);transform:translateX(104%);transition:transform .22s ease;
  font-family:system-ui,-apple-system,"Microsoft YaHei",sans-serif}
.ai-panel.open{transform:none}
.toolbar{transition:right .22s ease}
body.ai-open .toolbar{right:calc(clamp(320px,42vw,420px) + 16px)}
body.dark .ai-panel{background:#1b1d21;border-left-color:#34373d}
.ai-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid #e6e0d4}
body.dark .ai-head{border-bottom-color:#33363c}
.ai-head b{font-size:14px;font-weight:600}
.ai-status{flex:1;min-width:0;font-size:11px;color:#8a837a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-x{border:none;background:none;font-size:16px;line-height:1;cursor:pointer;color:#8a837a;padding:2px 6px}
.ai-x:hover{color:#b8433a}
.ai-target{padding:9px 14px;font-size:12.5px;line-height:1.7;color:#8a837a;
  border-bottom:1px solid #eee9dd;max-height:6.4em;overflow:auto}
body.dark .ai-target{border-bottom-color:#2c2f34;color:#a9a49b}
.ai-body{flex:1;overflow:auto;padding:14px 16px;font-size:14px;line-height:1.9;
  white-space:pre-wrap;word-break:break-word}
.ai-body.streaming::after{content:'▊';color:#b8433a;animation:aiBlink 1s steps(2) infinite}
@keyframes aiBlink{50%{opacity:0}}
.ai-foot{display:flex;gap:6px;padding:9px 12px;border-top:1px solid #e6e0d4;flex-wrap:wrap}
body.dark .ai-foot{border-top-color:#33363c}
.ai-foot button{border:1px solid #cfc8bb;background:#fff;color:#333;border-radius:7px;
  padding:4px 10px;font-size:12px;cursor:pointer}
body.dark .ai-foot button{background:#2a2d32;color:#ddd;border-color:#444}
.ai-foot button:hover{border-color:#b8433a;color:#b8433a}
.ai-set{display:none;padding:2px 14px 14px;border-top:1px solid #e6e0d4;font-size:12px}
.ai-set.open{display:block}
.ai-set label{display:block;color:#7c7367;margin:8px 0 2px}
.ai-set input,.ai-set select{width:100%;padding:4px 7px;border:1px solid #cfc8bb;border-radius:6px;
  font-size:12px;background:#fff;color:#333}
body.dark .ai-set input,body.dark .ai-set select{background:#2a2d32;color:#ddd;border-color:#444}
.ai-hint{color:#8a837a;font-size:11px;line-height:1.6;margin:8px 0 0}
.ai-hint b{color:#b8433a;font-weight:600}`;
    document.head.appendChild(css);

    const panel = document.createElement('aside');
    panel.className = 'ai-panel';
    panel.id = 'aiPanel';
    panel.innerHTML = `
      <div class="ai-head">
        <b>句子解析</b><span class="ai-status" id="aiStatus"></span>
        <button class="ai-x" type="button" id="aiClose" title="关闭（Esc）">✕</button>
      </div>
      <div class="ai-target" id="aiTarget"></div>
      <div class="ai-body" id="aiBody"></div>
      <div class="ai-foot">
        <button type="button" id="aiRetry">重新解析</button>
        <button type="button" id="aiCopy">复制结果</button>
        <button type="button" id="aiCopyQ" title="复制整段提问，粘贴到任意 AI 网页">复制提问</button>
        <button type="button" id="aiStop" style="display:none">停止</button>
        <button type="button" id="aiGear" title="设置">⚙</button>
      </div>
      <div class="ai-set" id="aiSet">
        <label>服务商</label>
        <select id="aiPreset"></select>
        <label>接口地址</label>
        <input id="aiBase" placeholder="http://127.0.0.1:11434">
        <label>模型名</label>
        <input id="aiModel" placeholder="qwen2.5:7b-instruct">
        <label>API Key（本地 Ollama 可留空）</label>
        <input id="aiKey" type="password" autocomplete="off" placeholder="sk-...">
        <div class="ai-hint">Key 只存在你自己的浏览器里，随请求直接发给你选的服务商，本站不经手。改完点「重新解析」生效。</div>
        <div class="ai-hint" id="aiHint"></div>
      </div>`;
    document.body.appendChild(panel);

    ui = {
      panel: panel,
      status: panel.querySelector('#aiStatus'),
      target: panel.querySelector('#aiTarget'),
      body: panel.querySelector('#aiBody'),
      stopBtn: panel.querySelector('#aiStop'),
      setBox: panel.querySelector('#aiSet'),
      presetSel: panel.querySelector('#aiPreset'),
      baseInput: panel.querySelector('#aiBase'),
      modelInput: panel.querySelector('#aiModel'),
      keyInput: panel.querySelector('#aiKey'),
      hint: panel.querySelector('#aiHint')
    };
    for (const p of PRESETS) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      ui.presetSel.appendChild(o);
    }
    ui.presetSel.value = presetId();
    ui.baseInput.value = base();
    ui.modelInput.value = model();
    ui.keyInput.value = apiKey();
    updateHint();

    panel.querySelector('#aiClose').addEventListener('click', closePanel);
    panel.querySelector('#aiRetry').addEventListener('click', rerun);
    panel.querySelector('#aiCopy').addEventListener('click', copyText);
    panel.querySelector('#aiCopyQ').addEventListener('click', copyQuestion);
    ui.stopBtn.addEventListener('click', stop);
    panel.querySelector('#aiGear').addEventListener('click', () => ui.setBox.classList.toggle('open'));
    ui.presetSel.addEventListener('change', () => {
      localStorage.setItem('jp-ai-preset', ui.presetSel.value);
      const p = preset();
      if (p.id !== 'custom') {
        ui.baseInput.value = p.base;
        ui.modelInput.value = p.model;
        localStorage.setItem('jp-ai-base', p.base);
        localStorage.setItem('jp-ai-model', p.model);
      }
      updateHint();
    });
    ui.baseInput.addEventListener('change', () => {
      localStorage.setItem('jp-ai-base', ui.baseInput.value.trim());
      updateHint();
    });
    ui.modelInput.addEventListener('change', () => localStorage.setItem('jp-ai-model', ui.modelInput.value.trim()));
    ui.keyInput.addEventListener('change', () => {
      localStorage.setItem('jp-ai-key', ui.keyInput.value.trim());
      updateHint();
    });
  }

  function updateHint() {
    if (!ui) return;
    const local = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/i.test(base());
    const parts = [];
    if (local) {
      parts.push('本地服务，不需要 Key。');
    } else {
      if (preset().key) parts.push('这个服务商需要 API Key。');
      parts.push('浏览器直连可能被服务商拦截（CORS），被拦时需要服务端或 Cloudflare Worker 反代，或改用「复制提问」。');
    }
    ui.hint.textContent = parts.join(' ');
  }

  function setStatus(s) { if (ui) ui.status.textContent = s; }
  function setBusy(on) {
    busy = on;
    if (!ui) return;
    ui.stopBtn.style.display = on ? '' : 'none';
    ui.body.classList.toggle('streaming', on);
  }

  function stop() {
    gen++;
    if (ctrl) { try { ctrl.abort(); } catch (e) { } ctrl = null; }
    if (busy) setBusy(false);
  }

  function rerun() {
    const sel = selectionInput() || lastSel;
    if (sel) {
      current = sel;
      ui.target.textContent = sel.sentence;
    }
    run(true);
  }

  async function run(force) {
    if (!current) return;
    if (needsKey()) {
      ui.body.textContent = '这个服务商需要 API Key：点面板底部的 ⚙，填入你自己的 Key，再点「重新解析」。\n\n不想配 Key 的话，可以点「复制提问」，把整段提问粘贴到任意 AI 网页里问。';
      setStatus('缺少 API Key');
      return;
    }
    const t = current;
    const cacheKey = hash(PROMPT_VERSION + '\u0000' + base() + '\u0000' + model() + '\u0000' + t.sentence + '\u0000' + t.before + '\u0000' + t.after);
    if (!force) {
      const hit = cacheGet(cacheKey);
      if (hit) {
        ui.body.textContent = hit;
        setStatus('缓存结果 · 点「重新解析」可重来');
        return;
      }
    }
    stop();
    const my = ++gen;
    ctrl = new AbortController();
    setBusy(true);
    ui.body.textContent = '';
    setStatus('连接 Ollama…');
    let out = '';
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey()) headers['Authorization'] = 'Bearer ' + apiKey();
      const res = await fetch(base() + '/v1/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: model(),
          stream: true,
          temperature: 0.2,
          messages: [
            { role: 'system', content: SYS },
            { role: 'user', content: buildPrompt(t) }
          ]
        }),
        signal: ctrl.signal
      });
      if (!res.ok) {
        const msg = (await res.text()).slice(0, 300);
        throw new Error('HTTP ' + res.status + ' ' + msg);
      }
      setStatus('解析中…');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const step = await reader.read();
        if (step.done) break;
        buf += dec.decode(step.value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const j = JSON.parse(data);
            const d = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
            if (d) {
              out += d;
              ui.body.textContent = out;
              ui.body.scrollTop = ui.body.scrollHeight;
            }
          } catch (e) { /* 半行，等下一块 */ }
        }
      }
      if (my !== gen) return;
      if (out.trim()) {
        cachePut(cacheKey, out);
        setStatus('完成');
      } else {
        setStatus('模型没有返回内容，检查模型名是否正确');
      }
    } catch (e) {
      if (my !== gen) return;
      if (e.name === 'AbortError') { setStatus('已停止'); return; }
      const local = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/i.test(base());
      ui.body.textContent = local
        ? '解析失败：' + e.message + '\n\n检查清单：\n' +
          '1. Ollama 是否在运行（托盘有羊驼图标，或终端执行 ollama list）\n' +
          '2. 模型是否已下载：ollama list 里要有 ' + model() + '\n' +
          '3. 是否允许网页访问：启动 Ollama 前设置 OLLAMA_ORIGINS=*\n' +
          '4. 地址是否正确：' + base()
        : '解析失败：' + e.message + '\n\n检查清单：\n' +
          '1. API Key 是否正确（点 ⚙ 重新填写；401/403 多半是这个）\n' +
          '2. 浏览器直连是否被服务商拦截（CORS）：DeepSeek、通义等常见，需要 Worker 反代，或改用「复制提问」\n' +
          '3. 地址和模型名是否正确：' + base() + ' / ' + model() + '\n' +
          '4. 账户余额是否足够';
      setStatus('出错了');
    } finally {
      if (my === gen) setBusy(false);
    }
  }

  function copyText() {
    const txt = (ui.body.textContent || '').trim();
    if (!txt) return;
    copyTextContent(txt, '已复制');
  }
  function copyQuestion() {
    if (!current) { setStatus('先选一句再复制提问'); return; }
    copyTextContent(SYS + '\n\n' + buildPrompt(current), '已复制提问，粘贴到任意 AI 网页即可');
  }
  function copyTextContent(txt, okMsg) {
    const done = () => setStatus(okMsg);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else {
      fallbackCopy(txt, done);
    }
  }
  function fallbackCopy(txt, done) {
    const ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { setStatus('复制失败'); }
    ta.remove();
  }

  function openPanel() {
    if (!ui) makeUI();
    ui.panel.classList.add('open');
    document.body.classList.add('ai-open');
    const t = resolveTarget();
    if (!t) {
      current = null;
      ui.target.textContent = '';
      ui.body.textContent = '选中要问的句子后点「解」，或者先点一下正文里的句子再点「解」。';
      setStatus('');
      return;
    }
    current = t;
    ui.target.textContent = t.sentence;
    run(false);
  }
  function closePanel() {
    stop();
    document.body.classList.remove('ai-open');
    if (ui) ui.panel.classList.remove('open');
  }

  document.addEventListener('mouseup', ev => {
    const t = ev.target;
    if (t && t.closest && t.closest('.toolbar, .ai-panel')) return;
    lastClick = { x: ev.clientX, y: ev.clientY };
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) lastSel = null;
  });
  document.addEventListener('selectionchange', () => {
    const sel = selectionInput();
    if (sel) lastSel = sel;
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && ui && ui.panel.classList.contains('open')) closePanel();
  });

  return {
    toggle() {
      if (!ui) makeUI();
      if (!ui.panel.classList.contains('open')) { openPanel(); return; }
      const t = resolveTarget();
      if (!t) {
        setStatus('先选中文字，或点一下正文里的句子');
        return;
      }
      current = t;
      ui.target.textContent = t.sentence;
      run(false);
    },
    open: openPanel,
    close: closePanel
  };
})();
