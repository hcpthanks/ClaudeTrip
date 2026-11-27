const FONT_PRESETS = [[19, '标准'], [22, '大'], [25, '超大']];
function nearestPreset(v) {
  return FONT_PRESETS.reduce((a, p) => Math.abs(p[0] - v) < Math.abs(a - v) ? p[0] : a, FONT_PRESETS[0][0]);
}
let fs = nearestPreset(parseFloat(localStorage.getItem('jp-fs')) || 19);
const BOOK_ID = document.body.dataset.book || 'default';
const JP_RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const JP_BEHAVIOR = JP_RM ? 'auto' : 'smooth';
function jpTop() { scrollTo({ top: 0, behavior: JP_BEHAVIOR }); }
(function () {
  window.JP_FULL = document.documentElement.classList.contains('jp-full');
})();
const SCROLL_KEY = 'jp-scroll:' + BOOK_ID;
const THEME_KEY = 'jp-theme-dark';
// 只取正文块：设置面板、提示条、解析面板里的说明文字不能进朗读队列 / 位置锚点
function bookBlocks() {
  return Array.from(document.querySelectorAll('h2, p')).filter(el =>
    !el.closest('.toolbar') && !el.closest('.jp-btip') && !el.closest('.jp-btip-mask')
    && !el.closest('.ai-panel') && !el.closest('.provenance'));
}
// 整本书改字号要重排全部段落（~1.5s），所以点击立即回显，连点合并成一次重排
let fontTimer = null;
let toastTimer = null;
function applyFont() {
  document.documentElement.style.setProperty('--fs', fs + 'px');
}
function markFontBtns() {
  FONT_PRESETS.forEach(([px], i) => {
    const b = document.getElementById('fsBtn' + i);
    if (b) {
      const on = px === fs;
      b.classList.toggle('fs-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  });
}
function setFont(px) {
  fs = px;
  localStorage.setItem('jp-fs', String(fs));
  const label = (FONT_PRESETS.find(p => p[0] === px) || [, '自定义'])[1];
  const toast = document.getElementById('fsToast');
  if (toast) {
    toast.textContent = label + '字号 · ' + px + 'px';
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 1100);
  }
  markFontBtns();
  clearTimeout(fontTimer);
  fontTimer = setTimeout(applyFont, 150);
}
function syncRubyUI() {
  const off = document.documentElement.classList.contains('no-ruby') || document.body.classList.contains('no-ruby');
  const btn = document.getElementById('rubyBtn');
  if (btn) {
    btn.classList.toggle('on', !off);
    btn.setAttribute('aria-pressed', String(!off));
    btn.setAttribute('aria-label', off ? '显示假名' : '隐藏假名');
  }
  const sel = document.getElementById('rubyMode');
  if (sel) sel.value = off ? 'off' : 'on';
}
function setRuby(mode) {
  if (document.documentElement.classList.contains('jp-limited')) return;
  const off = mode === 'off';
  document.documentElement.classList.toggle('no-ruby', off);
  document.body.classList.toggle('no-ruby', off);
  try { localStorage.setItem('jp-ruby', off ? 'off' : 'on'); } catch (e) {}
  syncRubyUI();
}
function toggleRuby() {
  const off = document.documentElement.classList.contains('no-ruby') || document.body.classList.contains('no-ruby');
  setRuby(off ? 'on' : 'off');
}
function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.setAttribute('aria-pressed', String(dark));
  return dark;
}
(function () {
  const ANCHOR_KEY = 'jp-anchor:' + BOOK_ID;
  const CHAPTER_KEY = 'jp-chapter:' + BOOK_ID;
  let HASH_TARGET = '';
  try { HASH_TARGET = location.hash ? decodeURIComponent(location.hash.slice(1)) : ''; } catch (e) { HASH_TARGET = ''; }
  let hashShown = false;
  const blocks = () => bookBlocks();
  function topBlock() {           // 二分找到视口顶部所在段落（rect 自上而下有序）
    const ps = blocks();
    let lo = 0, hi = ps.length - 1, found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ps[mid].getBoundingClientRect().bottom > 0) { found = mid; hi = mid - 1; }
      else lo = mid + 1;
    }
    return found;
  }
  function chapterAt(index) {     // 第几章（按 h2 计数，正文前为 0）
    if (index < 0) return 0;
    const ps = blocks();
    let n = 0;
    for (let k = 0; k <= index && k < ps.length; k++) if (ps[k].tagName === 'H2') n++;
    return n;
  }
  function savePos() {
    try {
      localStorage.setItem(SCROLL_KEY, scrollY);
      const max = document.documentElement.scrollHeight - innerHeight;
      localStorage.setItem('jp-progress:' + BOOK_ID, String(max > 0 ? Math.min(1, scrollY / max) : 0));
      localStorage.setItem('jp-last:' + BOOK_ID, String(Date.now()));
      const i = topBlock();
      if (i >= 0) {
        const el = blocks()[i];
        localStorage.setItem(ANCHOR_KEY, i + ':' + Math.round(el.getBoundingClientRect().top));
        localStorage.setItem(CHAPTER_KEY, String(chapterAt(i)));
      }
    } catch (e) { /* 隐私模式等写入失败时忽略 */ }
  }
  let t = null;
  let restored = false;
  addEventListener('scroll', () => {
    if (!restored) return;               // 恢复完成前不记录，避免把错误位置写成锚点
    clearTimeout(t);
    t = setTimeout(savePos, 300);
  });
  addEventListener('pagehide', savePos);
  // 位置记忆优先按段落锚点恢复：文档很大时懒排版会让像素偏移越来越不准
  function restorePos() {
    // 带句子深链（#b12）时以链接为准，不再恢复上次位置
    if (HASH_TARGET) {
      const target = document.getElementById(HASH_TARGET);
      if (target) {
        if (!hashShown) {
          target.scrollIntoView({ block: 'center', behavior: 'instant' });
          target.classList.add('hash-hl');
          setTimeout(() => target.classList.remove('hash-hl'), 2600);
          hashShown = true;
        }
        restored = true;
        return;
      }
    }
    const parts = (localStorage.getItem(ANCHOR_KEY) || '').split(':');
    const i = parseInt(parts[0], 10);
    const off = parseInt(parts[1], 10);
    const ps = blocks();
    const el = i >= 0 && i < ps.length ? ps[i] : null;
    const y = localStorage.getItem(SCROLL_KEY) || localStorage.getItem('jp-book-scroll');
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'instant' });
      if (off) scrollBy(0, -off);
    } else if (y) {
      scrollTo(0, +y);
    }
    restored = true;
  }
  setTimeout(restorePos, 80);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(restorePos, 80));
  }
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
(function () {
  const gear = document.getElementById('toolGear');
  const sheet = document.querySelector('.toolbar');
  const panel = document.getElementById('ttsPanel');
  if (!gear || !sheet) return;
  function closeSheet() {
    document.body.classList.remove('tools-open');
    if (panel) panel.classList.remove('open');
  }
  window.closeToolSheet = closeSheet;

  /* 桌面端可拖动：拖标题栏移动，双击标题栏复位；位置记在 jp-sheet-pos */
  const POS_KEY = 'jp-sheet-pos';
  const isNarrow = () => window.matchMedia('(max-width: 719px)').matches;
  function place(x, y) {
    const r = sheet.getBoundingClientRect();
    const w = r.width || Math.min(620, innerWidth - 32);
    const h = r.height || 200;
    const maxX = Math.max(8, innerWidth - w - 8);
    const maxY = Math.max(8, innerHeight - Math.min(h, 120) - 8);
    const px = Math.max(8, Math.min(x, maxX));
    const py = Math.max(8, Math.min(y, maxY));
    sheet.style.left = px + 'px';
    sheet.style.top = py + 'px';
    sheet.style.right = 'auto';
    sheet.style.bottom = 'auto';
    sheet.classList.add('dragged');
    return { x: px, y: py };
  }
  function restorePos() {
    if (isNarrow()) return;
    try {
      const p = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
      if (p && typeof p.x === 'number') place(p.x, p.y);
    } catch (e) { }
  }
  function resetPos() {
    try { localStorage.removeItem(POS_KEY); } catch (e) { }
    sheet.style.left = sheet.style.top = sheet.style.right = sheet.style.bottom = '';
    sheet.classList.remove('dragged');
  }
  const head = sheet.querySelector('.tool-sheet-head');
  if (head) {
    head.addEventListener('dblclick', resetPos);
    head.addEventListener('pointerdown', ev => {
      if (isNarrow() || ev.button !== 0) return;
      if (ev.target.closest('.tool-sheet-x')) return;
      const r = sheet.getBoundingClientRect();
      const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
      const move = e => place(e.clientX - dx, e.clientY - dy);
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        const r2 = sheet.getBoundingClientRect();
        try { localStorage.setItem(POS_KEY, JSON.stringify({ x: r2.left, y: r2.top })); } catch (e) { }
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
      ev.preventDefault();
    });
  }
  addEventListener('resize', () => {
    if (!sheet.classList.contains('dragged') || !document.body.classList.contains('tools-open')) return;
    const r = sheet.getBoundingClientRect();
    place(r.left, r.top);
  });

  gear.addEventListener('click', ev => {
    ev.stopPropagation();
    restorePos();
    document.body.classList.add('tools-open');
    if (panel) panel.classList.add('open');
  });
  const x = sheet.querySelector('.tool-sheet-x');
  if (x) x.addEventListener('click', closeSheet);
  document.addEventListener('click', ev => {
    if (!document.body.classList.contains('tools-open')) return;
    if (ev.target.closest && (ev.target.closest('.toolbar') || ev.target.closest('.tool-gear') || ev.target.closest('.tool-fab'))) return;
    // 延后关闭：让「点句子设起点 / 终点」先执行
    setTimeout(closeSheet, 0);
  });
  // 只有「解」会切到解析面板；其余设置改完面板保持打开，免得反复重开
  const aiOpenBtn = sheet.querySelector('#aiBtn');
  if (aiOpenBtn) aiOpenBtn.addEventListener('click', closeSheet);
})();
/* ---------- 阅读进度线 ---------- */
(function () {
  const bar = document.getElementById('readProgress');
  if (!bar) return;
  let queued = false;
  function update() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
})();
(function () {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.setAttribute('aria-pressed', String(document.body.classList.contains('dark')));
})();
(function () {
  if (!window.JP_FULL) {
    try { if (localStorage.getItem('jp-ruby') === null) document.documentElement.classList.add('no-ruby'); } catch (e) {}
  }
  const sel = document.getElementById('rubyMode');
  if (sel) sel.addEventListener('change', () => setRuby(sel.value));
  syncRubyUI();
})();
markFontBtns();

/* ---------- 朗读（Web Speech API，建议用 Edge 打开以获得日语自然音色） ---------- */
const TTS = (() => {
  if (!('speechSynthesis' in window)) {
    return {
      playPause() { }, stop() { }, prev() { }, next() { },
      replay() { }, clearRange() { }, setPick() { }, togglePanel() { }
    };
  }
  const synth = speechSynthesis;
  const playBtn = document.getElementById('ttsPlayBtn');
  const fab = document.getElementById('toolFab');
  const rcPlay = document.getElementById('rcPlay');
  const voiceSel = document.getElementById('ttsVoice');
  const rateEl = document.getElementById('ttsRate');
  const rateVal = document.getElementById('ttsRateVal');
  const repeatSel = document.getElementById('ttsRepeat');
  const modeSel = document.getElementById('ttsMode');
  const startInfo = document.getElementById('ttsStartInfo');
  const endInfo = document.getElementById('ttsEndInfo');
  const panel = document.getElementById('ttsPanel');
  const repeatBadge = document.getElementById('ttsRepeatBadge');
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
  let loopDone = 0;    // 整段循环已完成的遍数
  let curChunks = [];  // 当前句切出的语音片段
  let curChunk = 0;    // 当前片段下标
  let pickMode = null; // 'start' | 'end'：等待用户点句子设置范围
  let liveUtt = null;  // 持有当前 utterance 引用，Android Chrome 里被回收会静音
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
    bookBlocks().forEach(el => {
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

  // 第一次按播放时，从当前屏幕位置开始读，而不是回到书首
  function indexAtViewport() {
    if (!queue.length) buildQueue();
    if (!queue.length) return 0;
    const ps = bookBlocks();
    let block = null;
    for (const el of ps) {
      if (el.getBoundingClientRect().bottom > 0) { block = el; break; }
    }
    if (!block) return 0;
    for (let i = 0; i < queue.length; i++) if (queue[i].el === block) return i;
    return 0;
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
        first.scrollIntoView({ block: 'center', behavior: (typeof JP_BEHAVIOR === 'undefined' ? 'smooth' : JP_BEHAVIOR) });
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

  function repeatMode() {
    return modeSel.value === 'passage' ? 'passage' : 'sentence';
  }

  function finish() {
    state = 'idle';
    gen++;
    idx = startIdx == null ? 0 : startIdx;
    repDone = 0;
    loopDone = 0;
    hlIdx = -1;
    clearHL();
    updateBtn();
    updateRepeatBadge();
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
    updateRepeatBadge();
    speakChunk();
  }

  function speakChunk() {
    const u = new SpeechSynthesisUtterance(curChunks[curChunk]);
    const v = currentVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'ja-JP'; }
    u.rate = parseFloat(rateEl.value) || 1;
    liveUtt = u;
    const g = ++gen;
    u.onend = () => {
      if (state !== 'playing' || g !== gen) return;
      if (curChunk + 1 < curChunks.length) { curChunk++; speakChunk(); return; }
      if (repeatMode() === 'passage') {
        const last = endIdx == null ? queue.length - 1 : endIdx;
        if (idx < last) { speak(idx + 1); return; }
        loopDone++;
        if (loopDone < repeatCount()) { speak(startIdx == null ? 0 : startIdx); return; }
        loopDone = 0;
        finish();
        return;
      }
      repDone++;
      if (repDone < repeatCount()) {
        curChunk = 0;
        updateRepeatBadge();
        speakChunk();
      } else { repDone = 0; speak(idx + 1); }
    };
    u.onerror = ev => {
      if (g !== gen || state !== 'playing') return;
      if (ev.error === 'interrupted' || ev.error === 'canceled') return;
      if (ev.error === 'synthesis-failed' || ev.error === 'language-unavailable'
        || ev.error === 'voice-unavailable' || ev.error === 'not-allowed') {
        stop();
        if (typeof BROWSER_TIP !== 'undefined') BROWSER_TIP.warnNoVoice(null, true);
        return;
      }
      repDone = 0;
      speak(idx + 1);
    };
    synth.speak(u);
  }

  function updateBtn() {
    const playing = state === 'playing';
    playBtn.classList.toggle('is-playing', playing);
    playBtn.setAttribute('aria-label', playing ? '暂停朗读' : '朗读');
    playBtn.setAttribute('aria-pressed', String(playing));
    if (fab) {
      const label = playing ? '暂停朗读' : (state === 'paused' ? '继续朗读' : '开始朗读');
      fab.classList.toggle('is-playing', playing);
      fab.setAttribute('aria-label', label);
      fab.setAttribute('title', label);
      fab.setAttribute('aria-pressed', String(playing));
      if (rcPlay) {
        rcPlay.setAttribute('aria-label', label);
        rcPlay.setAttribute('aria-pressed', String(playing));
      }
    }
  }

  function updateRepeatBadge() {
    if (!repeatBadge) return;
    if (state === 'idle' || !queue.length) {
      repeatBadge.classList.remove('on');
      return;
    }
    const n = repeatCount();
    const passage = repeatMode() === 'passage';
    const parts = ['第 ' + (idx + 1) + '/' + queue.length + ' 句'];
    if (n > 1) {
      parts.push((passage ? '全段 ' : '本句 ') + ((passage ? loopDone : repDone) + 1) + '/' + n + ' 遍');
    }
    const rate = parseFloat(rateEl.value) || 1;
    parts.push(rate.toFixed(1) + '×');
    repeatBadge.textContent = parts.join(' · ');
    repeatBadge.classList.add('on');
  }

  function startFrom(i) {
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    idx = Math.max(0, Math.min(i, queue.length - 1));
    if (endIdx != null && idx > endIdx) idx = startIdx == null ? 0 : startIdx;
    repDone = 0;
    loopDone = 0;
    const wasIdle = state === 'idle';
    state = 'playing';
    // 空闲时没有待读内容，cancel 紧跟 speak 在 Android Chrome 里会吞掉第一句
    if (!wasIdle || synth.speaking || synth.pending) synth.cancel();
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
      if (hlIdx < 0 && startIdx == null) idx = indexAtViewport();
      if (typeof BROWSER_TIP !== 'undefined' && !BROWSER_TIP.hasJaVoice()) {
        BROWSER_TIP.warnNoVoice(() => startFrom(idx));
      } else {
        startFrom(idx);
      }
      return;
    }
    updateBtn();
    updateRepeatBadge();
  }

  function stop() {
    state = 'idle';
    gen++;
    repDone = 0;
    loopDone = 0;
    synth.cancel();
    clearHL();
    hlIdx = -1;
    updateBtn();
    updateRepeatBadge();
  }

  function jump(delta) {
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    let i = Math.max(0, Math.min(queue.length - 1, idx + delta));
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
    // 清完范围通常是要重新选，面板保持打开
  }

  function setPick(mode) {
    pickMode = mode === 'end' ? 'end' : 'start';
    if (window.closeToolSheet) window.closeToolSheet();
    else panel.classList.remove('open');
    const toast = document.getElementById('fsToast');
    if (toast) {
      toast.textContent = pickMode === 'end' ? '点正文中的句子 = 终点' : '点正文中的句子 = 起点';
      toast.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('on'), 1800);
    }
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
    const blocks = Array.from(bookBlocks());
    const bi = blocks.indexOf(item.el);
    return {
      sentence: item.text,
      before: bi > 0 ? blockText(blocks[bi - 1]) : '',
      after: bi >= 0 && bi + 1 < blocks.length ? blockText(blocks[bi + 1]) : '',
      block: item.el && item.el.id ? item.el.id : ''
    };
  }

  function globalTextOffset(node, off) {
    let total = 0;
    const blocks = bookBlocks();
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
    if (applySelectionRange() && window.closeToolSheet) window.closeToolSheet();
  }

  let downX = 0;
  let downY = 0;
  document.addEventListener('mousedown', ev => { downX = ev.clientX; downY = ev.clientY; });

  function onDocClick(ev) {
    if (!panel.classList.contains('open') && !pickMode) return;
    if (ev.target.closest && ev.target.closest('.toolbar')) return;
    if (Math.abs(ev.clientX - downX) > 5 || Math.abs(ev.clientY - downY) > 5) return; // 拖动选字，不改范围
    if (!queue.length) buildQueue();
    if (!queue.length) return;
    let i = queueIndexAtRange(pointRange(ev.clientX, ev.clientY));
    if (i < 0) return;
    if (pickMode) {
      if (pickMode === 'end') {
        if (startIdx != null && i < startIdx) i = startIdx;
        endIdx = i;
      } else {
        startIdx = i;
        if (endIdx != null && endIdx < startIdx) endIdx = null;
        // 设范围只设范围，不顺手开始播放
        if (state === 'idle') { idx = i; highlight(queue[i]); hlIdx = i; }
      }
      pickMode = null;
      updateRangeInfo();
      return;
    }
    if (ev.shiftKey) {
      if (startIdx != null && i < startIdx) i = startIdx;
      endIdx = i;
    } else {
      startIdx = i;
      if (endIdx != null && endIdx < startIdx) endIdx = null;
      if (state === 'idle') { idx = i; highlight(queue[i]); hlIdx = i; }
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
    updateRepeatBadge();
  });
  repeatSel.value = localStorage.getItem('jp-tts-repeat') || '1';
  if (!repeatSel.value) repeatSel.value = '1';
  repeatSel.addEventListener('change', () => {
    localStorage.setItem('jp-tts-repeat', repeatSel.value);
    updateRepeatBadge();
  });
  modeSel.value = localStorage.getItem('jp-tts-mode') || 'sentence';
  modeSel.addEventListener('change', () => {
    localStorage.setItem('jp-tts-mode', modeSel.value);
    loopDone = 0;
    updateRepeatBadge();
  });
  voiceSel.addEventListener('change', () => {
    localStorage.setItem('jp-tts-voice', voiceSel.value);
  });
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
    setPick,
    isPicking() { return !!pickMode; },
    /* 单击正文：朗读中从该句接着读；停止时不做事 */
    jumpToPoint(x, y) {
      if (state !== 'playing' && state !== 'paused') return false;
      if (!queue.length) buildQueue();
      if (!queue.length) return false;
      const i = queueIndexAtRange(pointRange(x, y));
      if (i < 0) return false;
      startIdx = i;
      idx = i;
      if (endIdx != null && endIdx < startIdx) endIdx = null;
      startFrom(i);
      updateRangeInfo();
      return true;
    },
    getTarget: explainTarget,
    togglePanel() { panel.classList.toggle('open'); }
  };
})();

/* ---------- 查词：点正文里的词，右侧出词条 ---------- */
const DICT = (() => {
  const STORE_KEY = 'jp-dict';
  const SKIP_POS = /^(助詞|助動詞|記号|空白|フィラー)/;

  let data = null, maxLen = 1;
  let panel = null, bodyEl = null;
  let cur = null;
  let downX = 0, downY = 0;

  const enabled = () => localStorage.getItem(STORE_KEY) !== '0';
  const readonly = () => document.documentElement.classList.contains('jp-limited');

  function load() {
    if (data) return data;
    data = { s: {}, w: {} };
    const el = document.getElementById('dictData');
    if (el) {
      try { data = JSON.parse(el.textContent); } catch (e) { data = { s: {}, w: {} }; }
    }
    for (const k in data.w) { if (k.length > maxLen) maxLen = k.length; }
    return data;
  }

  /* ---- 文本偏移工具：跳过 rt，口径与朗读/位置记忆一致 ---- */
  function textNodes(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (n.parentElement && n.parentElement.tagName === 'RT') continue;
      out.push(n);
    }
    return out;
  }
  const plain = root => textNodes(root).map(n => n.nodeValue).join('');
  function offsetOf(root, node, local) {
    let acc = 0;
    for (const n of textNodes(root)) {
      if (n === node) return acc + local;
      acc += n.nodeValue.length;
    }
    return null;
  }
  function nodeAt(root, off) {
    let acc = 0, edge = null;
    for (const n of textNodes(root)) {
      const L = n.nodeValue.length;
      if (off < acc + L) return { node: n, local: off - acc };
      if (off === acc + L) edge = { node: n, local: L };
      acc += L;
    }
    return edge;
  }
  function pointOffset(root, x, y) {
    const r = document.caretRangeFromPoint(x, y);
    if (!r) return null;
    let node = r.startContainer;
    if (node.nodeType === 3 && node.parentElement && node.parentElement.tagName === 'RT') {
      node = textNodes(node.parentElement.parentElement)[0];
      if (!node) return null;
      return offsetOf(root, node, 0);
    }
    if (node.nodeType !== 3) return null;
    return offsetOf(root, node, r.startOffset);
  }

  /* ---- 取词：包含点击位置的最长词（不是从点击处往后匹配）---- */
  function resolve(text, off) {
    const d = load();
    let best = null;
    for (let s = Math.max(0, off - 8); s <= off; s++) {
      for (let L = Math.min(maxLen, text.length - s); L >= 1; L--) {
        if (s + L <= off) break;
        const cand = text.slice(s, s + L);
        const base = d.s[cand] || cand;
        if (d.w[base] && (!best || L > best.L)) best = { s, L, word: cand, base };
      }
    }
    return best;
  }

  /* 取包含该位置的整句：以 。！？ 断句，带上成对的引号 */
  function sentenceBounds(t, s, e) {
    const END = '。！？!?．';
    const CLOSE = '」』）)】〕';
    let a = s;
    while (a > 0 && END.indexOf(t[a - 1]) < 0 && CLOSE.indexOf(t[a - 1]) < 0) a--;
    while (a < t.length && CLOSE.indexOf(t[a]) >= 0) a++;
    let b = e;
    while (b < t.length && END.indexOf(t[b]) < 0) b++;
    if (b < t.length) b++;
    while (b < t.length && CLOSE.indexOf(t[b]) >= 0) b++;
    if (t[b - 1] === '」' || t[b - 1] === '』') {
      const open = t[b - 1] === '」' ? '「' : '『';
      const hit = t.lastIndexOf(open, a);
      if (hit >= 0) a = hit;
    }
    return [a, b];
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /* 从原文里切一段，保留 ruby，例句也能看到假名 */
  function sliceFragment(root, start, end) {
    const a = nodeAt(root, start), b = nodeAt(root, end);
    if (!a || !b) return null;
    const r = document.createRange();
    r.setStart(a.node, a.local);
    r.setEnd(b.node, b.local);
    return r.cloneContents();
  }

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement('aside');
    panel.className = 'ai-panel dict-panel';
    panel.id = 'dictPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '查词');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML =
      '<div class="ai-head"><b>查词</b><span class="ai-status" id="dictStatus"></span>' +
      '<button class="ai-x" type="button" id="dictClose" title="关闭（Esc）">✕</button></div>' +
      '<div class="dict-body" id="dictBody"></div>';
    document.body.appendChild(panel);
    bodyEl = panel.querySelector('#dictBody');
    panel.querySelector('#dictClose').addEventListener('click', close);
  }

  function open() {
    if (!panel) return;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ai-open');
  }
  function close() {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.ai-panel.open')) document.body.classList.remove('ai-open');
  }

  function jump(pid, off) {
    const host = document.getElementById('b' + pid);
    if (!host) return;
    const at = typeof off === 'number' ? nodeAt(host, off) : null;
    const r = at ? (() => {
      const rg = document.createRange();
      rg.setStart(at.node, at.local);
      rg.setEnd(at.node, Math.min(at.local + 1, at.node.nodeValue.length));
      return rg.getBoundingClientRect();
    })() : null;
    if (r && (r.top || r.height)) {
      const top = window.scrollY + r.top - window.innerHeight * 0.35;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      host.scrollIntoView({ block: 'center' });
    }
    host.classList.remove('dict-jump');
    void host.offsetWidth;
    host.classList.add('dict-jump');
    setTimeout(() => host.classList.remove('dict-jump'), 1700);
  }

  function askAI() {
    if (!cur) return;
    const { paraEl, start, len } = cur;
    const a = nodeAt(paraEl, start), b = nodeAt(paraEl, start + len);
    let x = 0, y = 0;
    if (a && b) {
      const r = document.createRange();
      r.setStart(a.node, a.local);
      r.setEnd(b.node, b.local);
      const rc = r.getBoundingClientRect();
      x = rc.left + rc.width / 2;
      y = rc.top + rc.height / 2;
    }
    paraEl.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
    close();
    if (typeof EXPLAIN !== 'undefined' && typeof EXPLAIN.open === 'function') EXPLAIN.open();
  }

  function render(rec, word) {
    bodyEl.textContent = '';

    const head = el('div', 'dict-word');
    head.appendChild(el('b', null, word));
    if (rec.r) head.appendChild(el('span', 'dict-read', rec.r));
    if (rec.p) head.appendChild(el('span', 'dict-pos', rec.p));
    bodyEl.appendChild(head);

    bodyEl.appendChild(el('p', rec.g ? 'dict-gloss' : 'dict-gloss dict-none',
      rec.g || '未收录释义'));

    const meta = el('div', 'dict-meta');
    meta.appendChild(el('span', 'dict-pill', '本书内'));
    meta.appendChild(document.createTextNode('出现 ' + rec.n + ' 次'));
    bodyEl.appendChild(meta);

    const list = [];
    for (const item of rec.e || []) {
      const pid = item[0], s = item[1], e = item[2];
      const host = document.getElementById('b' + pid);
      if (!host) continue;
      const t = plain(host);
      const bounds = sentenceBounds(t, s, e);
      const sa = bounds[0], sb = bounds[1];
      const a = Math.max(sa, s - 24);
      const b = Math.min(sb, e + 24);
      const mid = sliceFragment(host, s, Math.min(e, b));
      if (!mid) continue;
      const p = el('p', 'dict-ex');
      p.setAttribute('data-para', String(pid));
      p.setAttribute('data-start', String(sa));
      if (a > sa) p.appendChild(document.createTextNode('…'));
      const before = sliceFragment(host, a, s);
      if (before) p.appendChild(before);
      const mark = document.createElement('mark');
      mark.appendChild(mid);
      p.appendChild(mark);
      const after = sliceFragment(host, Math.min(e, b), b);
      if (after) p.appendChild(after);
      if (b < sb) p.appendChild(document.createTextNode('…'));
      list.push(p);
    }
    if (list.length) {
      bodyEl.appendChild(el('div', 'dict-sec', '本书例句'));
      for (const p of list) {
        p.addEventListener('click', () => jump(
          Number(p.getAttribute('data-para')), Number(p.getAttribute('data-start'))));
        bodyEl.appendChild(p);
      }
    }

    const acts = el('div', 'dict-actions');
    const ask = el('button', 'primary', '问 AI 讲这句');
    ask.type = 'button';
    ask.addEventListener('click', askAI);
    acts.appendChild(ask);
    if (list.length && cur) {
      const go = el('button', null, '跳到该句');
      go.type = 'button';
      go.addEventListener('click', () => {
        const text = plain(cur.paraEl);
        jump(cur.paraEl.id.slice(1), sentenceBounds(text, cur.start, cur.start + cur.len)[0]);
      });
      acts.appendChild(go);
    }
    bodyEl.appendChild(acts);
    bodyEl.scrollTop = 0;
  }

  let tapTimer = null;

  function textBlock(ev) {
    const t = ev.target;
    if (!t || !t.closest) return null;
    if (t.closest('.toolbar, .ai-panel, .dict-panel, .tool-fab, .tool-gear, .book-back, .skip-link, .read-progress, .trial-chip')) return null;
    if (document.body.classList.contains('tools-open')) return null;
    if (typeof TTS !== 'undefined' && typeof TTS.isPicking === 'function' && TTS.isPicking()) return null;
    if (Math.abs(ev.clientX - downX) > 5 || Math.abs(ev.clientY - downY) > 5) return null;  // 拖动选字
    return t.closest('p, h2');
  }

  function lookupAt(ev) {
    if (!enabled() || readonly()) return;
    const p = textBlock(ev);
    if (!p) return;
    const off = pointOffset(p, ev.clientX, ev.clientY);
    if (off === null) return;
    const text = plain(p);
    const hit = resolve(text, off);
    if (!hit) return;
    const rec = load().w[hit.base];
    if (!rec || SKIP_POS.test(rec.p || '')) return;
    // 单假名（の・に・で・と…）多半是助词用法，不弹
    if (hit.word.length === 1 && /[぀-ヿ]/.test(hit.word)) return;
    cur = { paraEl: p, start: hit.s, len: hit.L, word: hit.word };
    ensurePanel();
    if (typeof EXPLAIN !== 'undefined' && document.body.classList.contains('ai-open')) EXPLAIN.close();
    render(rec, hit.word);
    open();
  }

  /* 规则：双击 = 查词；朗读中单击 = 从该句接着读；其它情况单击不做事 */
  document.addEventListener('mousedown', ev => {
    downX = ev.clientX;
    downY = ev.clientY;
  }, true);

  // 单击：延后 320ms 执行，等双击判定；双击时被取消
  document.addEventListener('click', ev => {
    if (!textBlock(ev)) return;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      if (typeof TTS !== 'undefined' && typeof TTS.jumpToPoint === 'function') {
        TTS.jumpToPoint(ev.clientX, ev.clientY);
      }
    }, 320);
  }, true);

  // 双击：查词（浏览器自己判定，比手写计时间隔可靠）
  document.addEventListener('dblclick', ev => {
    if (!textBlock(ev)) return;
    clearTimeout(tapTimer);
    lookupAt(ev);
  }, true);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && panel && panel.classList.contains('open')) close();
  });

  function bindSetting() {
    const mode = document.getElementById('dictMode');
    if (!mode) return;
    mode.value = enabled() ? 'on' : 'off';
    mode.addEventListener('change', () => {
      localStorage.setItem(STORE_KEY, mode.value === 'on' ? '1' : '0');
      if (mode.value === 'off') close();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSetting);
  else bindSetting();

  return { open, close, jump, askAI, enabled, load };
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
    const blocks = Array.from(bookBlocks());
    const i = blocks.indexOf(block);
    return {
      sentence: sentence,
      before: i > 0 ? blockText(blocks[i - 1]) : '',
      after: i >= 0 && i + 1 < blocks.length ? blockText(blocks[i + 1]) : '',
      block: block.id || ''
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
    const panel = document.createElement('aside');
    panel.className = 'ai-panel';
    panel.id = 'aiPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '句子解析');
    panel.setAttribute('aria-hidden', 'true');
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
        <button type="button" id="aiLink" title="复制这一句的网址，打开后直接跳到本句">复制本句链接</button>
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
    panel.querySelector('#aiLink').addEventListener('click', copyLink);
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
  function copyLink() {
    if (!current || !current.block) { setStatus('先选中一句再复制链接'); return; }
    const url = location.href.split('#')[0] + '#' + current.block;
    copyTextContent(url, '已复制本句链接');
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
    ui.panel.setAttribute('aria-hidden', 'false');
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
    if (ui) {
      if (ui.panel.contains(document.activeElement)) {
        const btn = document.getElementById('aiBtn');
        if (btn) btn.focus();
      }
      ui.panel.classList.remove('open');
      ui.panel.setAttribute('aria-hidden', 'true');
    }
  }

  document.addEventListener('mouseup', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    // 只有点在正文块上才记录；点工具按钮 / 面板不能覆盖上一次的句子位置
    if (t.closest('.toolbar, .ai-panel, .tool-fab, .book-back, .skip-link, .read-progress')) return;
    if (!t.closest('p, h2')) return;
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

/* ---------- 登记 / 权限 / 每日额度 ---------- */
(function () {
  var PROD_API = 'https://api.hcpthanks.ccwu.cc';
  var localish = location.protocol === 'file:' || location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  var API = localish ? 'http://127.0.0.1:8787' : PROD_API;

  var de = document.documentElement;
  var chip = document.getElementById('jpChip');
  if (!chip) return;
  var chipLabel = document.getElementById('jpChipLabel');
  var chipTime = document.getElementById('jpChipTime');
  var gate = document.getElementById('jpGate');
  var auth = document.getElementById('jpAuth');
  var remind = document.getElementById('jpRemind');
  var authMsg = document.getElementById('authMsg');

  var GUEST_MS = 15 * 60 * 1000;
  var REFRESH_MS = 2 * 60 * 1000;
  var PING_MS = 15000;
  var REMIND_SEC = 30 * 60;

  var snap = null;
  var guestStart = Date.now();
  var guestExpired = false;
  var sessionSec = 0;
  var reminded = false;

  try { guestStart = +(localStorage.getItem('jp-guest-start') || 0) || Date.now(); } catch (e) { }
  try { snap = JSON.parse(localStorage.getItem('jp-ent') || 'null'); } catch (e) { snap = null; }

  function tok() { try { return localStorage.getItem('jp-token') || ''; } catch (e) { return ''; } }
  function storeEnt(s) {
    try { s._at = Date.now(); s.exp = Date.now() + REFRESH_MS; localStorage.setItem('jp-ent', JSON.stringify(s)); } catch (e) { }
  }
  function wipe() {
    try { localStorage.removeItem('jp-token'); localStorage.removeItem('jp-ent'); } catch (e) { }
    snap = null;
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    if (s >= 3600) return Math.floor(s / 3600) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60);
    return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }
  function setFull(full) {
    var wasFull = de.classList.contains('jp-full');
    de.classList.toggle('jp-full', !!full);
    de.classList.toggle('jp-limited', !full);
    window.JP_FULL = !!full;
    // 权限恢复时，若用户没显式关过假名，就把它放回来
    if (full && !wasFull) {
      var pref = null;
      try { pref = localStorage.getItem('jp-ruby'); } catch (e) { }
      if (pref === null) {
        de.classList.remove('no-ruby');
        document.body.classList.remove('no-ruby');
      }
    }
  }
  function label(a, b, t) {
    chip.hidden = false;
    chipLabel.textContent = a;
    chipTime.textContent = b || '';
    chipTime.hidden = !b;
    chip.setAttribute('data-tone', t || 'ok');
  }
  function remainOf(s) {
    var age = s._at ? Date.now() - s._at : 0;
    return Math.max(0, (s.remaining || 0) - age);
  }
  function renderChip() {
    if (snap) {
      var r = remainOf(snap);
      if (snap.state === 'paid') { label('通票', fmt(r), 'ok'); return; }
      if (snap.state === 'member') { label('完整体验', fmt(r), r < 3600000 ? 'warn' : 'ok'); return; }
      if (snap.state === 'daily') { label('今日', fmt(r), r < 60000 ? 'warn' : 'ok'); return; }
      if (snap.state === 'staying') { label('已读 ' + fmt((snap.todaySeconds || 0) * 1000) + ' / 10:00', '', 'warn'); return; }
      if (snap.state === 'limited') { label('今天到此为止', '', 'off'); return; }
      return;
    }
    var left = GUEST_MS - (Date.now() - guestStart);
    if (left > 0) label('首次体验', fmt(left), left < 60000 ? 'warn' : 'ok');
    else label('登记后可继续', '', 'off');
  }
  function applySnap(s) {
    snap = s;
    storeEnt(s);
    setFull(!!s.full);
    renderChip();
  }

  function api(path, body) {
    var h = { 'Content-Type': 'application/json' };
    var t = tok();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(API + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) })
      .then(function (r) {
        return r.json().then(
          function (d) { return { status: r.status, data: d }; },
          function () { return { status: r.status, data: {} }; }
        );
      })
      .catch(function () { return { status: 0, data: {} }; });
  }

  function ping() {
    if (!tok()) return;
    api('/heartbeat', {}).then(function (res) {
      if (res.status === 401) { wipe(); setFull(false); renderChip(); return; }
      if (res.data && res.data.ok) applySnap(res.data);
    });
  }

  function open(el) {
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    var card = el.querySelector('.gate-card');
    if (card) { card.setAttribute('tabindex', '-1'); card.focus(); }
  }
  function close(el) {
    if (!el) return;
    el.hidden = true;
    if (gate.hidden && auth.hidden && remind.hidden) document.body.style.overflow = '';
  }

  function bind(ids, fn) {
    ids.split(',').forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', fn);
    });
  }

  chip.addEventListener('click', function () { open(auth); });
  bind('jpGateX,jpGateLater', function () { close(gate); });
  bind('jpRemindX,jpRemindLater', function () { close(remind); });
  bind('jpAuthX,authSkip', function () { close(auth); });

  var gateLogin = document.getElementById('jpGateLogin');
  if (gateLogin) gateLogin.addEventListener('click', function () { close(gate); open(auth); });
  var remindPay = document.getElementById('jpRemindPay');
  if (remindPay) remindPay.addEventListener('click', function () { close(remind); open(gate); });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!remind.hidden) { close(remind); return; }
    if (!gate.hidden) { close(gate); return; }
    if (!auth.hidden) close(auth);
  });

  /* ---------- 登记 ---------- */
  var emailEl = document.getElementById('authEmail');
  var codeEl = document.getElementById('authCode');
  var codeWrap = document.getElementById('authCodeWrap');
  var sendBtn = document.getElementById('authSend');
  var loginBtn = document.getElementById('authLogin');

  function msg(t, t2) {
    authMsg.textContent = t || '';
    authMsg.setAttribute('data-tone', t2 || '');
  }

  if (sendBtn) sendBtn.addEventListener('click', function () {
    var email = (emailEl.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg('邮箱格式不对', 'err'); emailEl.focus(); return; }
    sendBtn.disabled = true;
    msg('正在发送…');
    api('/auth/request-code', { email: email }).then(function (res) {
      sendBtn.disabled = false;
      if (res.status === 429) { msg((res.data && res.data.error) || '请求太频繁，过一会儿再来', 'err'); return; }
      if (!res.data || !res.data.ok) { msg('验证码没发出去，稍后再试', 'err'); return; }
      codeWrap.hidden = false;
      loginBtn.hidden = false;
      sendBtn.hidden = true;
      if (res.data.devCode) {
        codeEl.value = res.data.devCode;
        msg('开发模式：验证码 ' + res.data.devCode, 'ok');
      } else {
        msg('验证码已发出，十分钟内有效', 'ok');
      }
      codeEl.focus();
    });
  });

  if (loginBtn) loginBtn.addEventListener('click', function () {
    var email = (emailEl.value || '').trim();
    var code = (codeEl.value || '').trim();
    if (!/^\d{6}$/.test(code)) { msg('请填六位验证码', 'err'); codeEl.focus(); return; }
    loginBtn.disabled = true;
    msg('正在登录…');
    api('/auth/verify', { email: email, code: code }).then(function (res) {
      loginBtn.disabled = false;
      if (res.data && res.data.ok && res.data.token) {
        try { localStorage.setItem('jp-token', res.data.token); } catch (e) { }
        applySnap(res.data);
        close(auth);
        codeWrap.hidden = true;
        loginBtn.hidden = true;
        sendBtn.hidden = false;
        codeEl.value = '';
        msg('');
        ping();
        return;
      }
      msg((res.data && res.data.error) || '验证码不对或已过期', 'err');
    });
  });

  /* ---------- 计时 ---------- */
  function tick() {
    if (document.hidden) return;
    sessionSec++;
    if (!reminded && sessionSec >= REMIND_SEC) { reminded = true; open(remind); }
    if (!snap) {
      var left = GUEST_MS - (Date.now() - guestStart);
      if (left <= 0 && !guestExpired) {
        guestExpired = true;
        setFull(false);
        open(auth);
      }
    }
    renderChip();
  }

  renderChip();
  setFull(!de.classList.contains('jp-limited'));
  if (tok()) ping();
  setInterval(tick, 1000);
  setInterval(function () { if (!document.hidden) ping(); }, PING_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });
})();
