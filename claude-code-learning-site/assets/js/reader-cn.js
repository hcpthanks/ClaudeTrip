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
    if (ev.target.closest && (ev.target.closest('.toolbar') || ev.target.closest('.tool-gear'))) return;
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
  const TTS_LANG = /^zh/i.test(document.documentElement.lang) ? 'zh' : 'ja';
  const VOICE_KEY = 'jp-tts-voice' + (TTS_LANG === 'zh' ? '-zh' : '');
  const playBtn = document.getElementById('ttsPlayBtn');
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
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = TTS_LANG === 'zh' ? 'zh-CN' : 'ja-JP'; }
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
    if (rcPlay) {
      const label = playing ? '暂停朗读' : (state === 'paused' ? '继续朗读' : '开始朗读');
      rcPlay.setAttribute('aria-label', label);
      rcPlay.setAttribute('title', label);
      rcPlay.setAttribute('aria-pressed', String(playing));
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
    const list = synth.getVoices().filter(v => new RegExp('^' + TTS_LANG, 'i').test(v.lang));
    voiceSel.innerHTML = '';
    if (!list.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = TTS_LANG === 'zh' ? '没有中文语音。用 Edge 打开试试。' : '没有日语语音。用 Edge 打开试试。';
      voiceSel.appendChild(o);
      return;
    }
    for (const v of list) {
      const o = document.createElement('option');
      o.value = v.voiceURI;
      o.textContent = v.name + (v.localService ? '' : ' · 在线');
      voiceSel.appendChild(o);
    }
    const saved = localStorage.getItem(VOICE_KEY);
    const pref = TTS_LANG === 'zh' ? /xiaoxiao|yunxi|natural|online/i : /nanami|natural|online/i;
    const chosen = list.find(v => v.voiceURI === saved)
      || list.find(v => pref.test(v.name))
      || list[0];
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
    localStorage.setItem(VOICE_KEY, voiceSel.value);
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
  var guestExpired = false;
  var sessionSec = 0;
  var reminded = false;

  try { snap = JSON.parse(localStorage.getItem('jp-ent') || 'null'); } catch (e) { snap = null; }

  /* 未注册用户：每个自然日一次 15 分钟，按北京时间切日 */
  function guestDay() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
  function guestUsed() {
    try {
      if (localStorage.getItem('jp-guest-day') !== guestDay()) {
        localStorage.setItem('jp-guest-day', guestDay());
        localStorage.setItem('jp-guest-used', '0');
        return 0;
      }
      return +(localStorage.getItem('jp-guest-used') || 0) || 0;
    } catch (e) { return 0; }
  }
  function addGuestUsed(ms) {
    try {
      var v = guestUsed() + ms;
      localStorage.setItem('jp-guest-day', guestDay());
      localStorage.setItem('jp-guest-used', String(v));
      return v;
    } catch (e) { return GUEST_MS; }
  }

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
    chip.title = snap ? '已登记' : '点此登记';
    if (snap) {
      var r = remainOf(snap);
      if (snap.state === 'paid') { label('通票', fmt(r), 'ok'); return; }
      if (snap.state === 'member') { label('完整功能', fmt(r), r < 3600000 ? 'warn' : 'ok'); return; }
      if (snap.state === 'daily') { label('今日', fmt(r), r < 60000 ? 'warn' : 'ok'); return; }
      if (snap.state === 'limited') { label('今天先到这儿', '', 'off'); return; }
      return;
    }
    var left = GUEST_MS - guestUsed();
    if (left > 0) label('今日体验', fmt(left), left < 60000 ? 'warn' : 'ok');
    else label('登记后接着读', '', 'off');
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

  chip.addEventListener('click', function () { if (tok()) return; open(auth); });
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
  var lastTick = Date.now();
  function tick() {
    var now = Date.now();
    // 后台标签页的定时器会被浏览器降频，按真实经过时间补，单次最多补 90 秒
    var delta = Math.min(90000, Math.max(0, now - lastTick));
    lastTick = now;
    sessionSec += delta / 1000;
    if (!reminded && sessionSec >= REMIND_SEC) { reminded = true; open(remind); }
    if (!snap && !tok()) {
      var used = addGuestUsed(delta);
      if (used >= GUEST_MS && !guestExpired) {
        guestExpired = true;
        setFull(false);
        open(auth);
      }
    } else if (snap && snap.full && remainOf(snap) <= 0) {
      snap.full = false;
      snap.state = 'limited';
      snap.remaining = 0;
      setFull(false);
    }
    renderChip();
  }

  renderChip();
  setFull(!de.classList.contains('jp-limited'));
  if (tok()) ping();
  setInterval(tick, 1000);
  setInterval(ping, PING_MS);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ping(); });
})();
