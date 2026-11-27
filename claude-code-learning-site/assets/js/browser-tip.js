/* ---------- 浏览器提示：朗读只在 Edge 完整可用（Chrome 常缺日语语音，Firefox 音色少） ---------- */
const BROWSER_TIP = (() => {
  const DISMISS_KEY = 'jp-btip-dismissed';
  const SILENT_KEY = 'jp-btip-allow-silent';
  const GENERAL = {
    title: '换成 Edge 打开，声音会好一些',
    body: 'Chrome 多半没有日语语音。Firefox 能选的声音很少。Edge 自带七海、圭太。'
  };
  const ALARM = {
    title: '这台机器没有日语语音，读不出声',
    body: '复制网址，粘贴到 Edge 里打开。'
  };
  const ALARM_EDGE = {
    title: 'Edge 的日语语音还没加载出来',
    body: '它要联网。检查网络，刷新这一页。'
  };
  const ALARM_ANDROID = {
    title: '这台手机没有日语语音，读不出声',
    body: '设置 → 语言和输入法 → 文字转语音，选 Google 文字转语音，下载日语。装过就重启手机。'
  };
  const SAFARI_IOS = {
    title: '用 Safari 打开这一页',
    body: 'iPhone 上的 Chrome、Firefox 读得不完整。Safari 可以。复制网址，到 Safari 里打开。'
  };
  const ALARM_IOS = {
    title: 'Safari 还没加载日语语音',
    body: '设置 → 辅助功能 → 朗读内容 → 声音 → 日语，下载后刷新这一页。'
  };
  const NO_SUPPORT = {
    title: '这个浏览器不支持朗读',
    body: '复制网址，用电脑 Edge 或 iPhone 的 Safari 打开。'
  };
  const NO_SUPPORT_ANDROID = {
    title: '这个浏览器读不出声',
    body: '用 Chrome 或手机自带的浏览器打开。也可以复制网址，到 Safari 或电脑 Edge 打开。'
  };
  let bar = null;

  function store(key, val) {
    try { val == null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, val); } catch (e) { }
  }
  function stored(key) {
    try { return sessionStorage.getItem(key) === '1'; } catch (e) { return false; }
  }

  function isEdge() {
    const ua = navigator.userAgent || '';
    if (/Edg(e|A|iOS)?\//.test(ua) || /\bEdge\//.test(ua)) return true;
    const brands = navigator.userAgentData && navigator.userAgentData.brands;
    return !!brands && brands.some(b => /Microsoft Edge/i.test(b.brand));
  }

  function platform() {
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/i.test(ua)
      || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    return 'desktop';
  }

  function isSafariOnIOS() {
    return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//i.test(navigator.userAgent || '');
  }

  function canSpeak() { return 'speechSynthesis' in window; }
  function jaVoices() {
    if (!canSpeak()) return [];
    try { return speechSynthesis.getVoices().filter(v => /^ja/i.test(v.lang)); } catch (e) { return []; }
  }
  function hasJaVoice() { return jaVoices().length > 0; }

  function syncHeight() {
    if (!bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--jp-btip-h', h + 'px');
  }

  function copyUrl(btn) {
    const url = location.href;
    const say = ok => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = ok ? '已复制' : '请手动复制';
      setTimeout(() => { btn.textContent = old; }, 1800);
    };
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { }
      ta.remove();
      say(ok);
      if (!ok) window.prompt('复制下面的网址，用 Edge 打开：', url);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => say(true), fallback);
    } else {
      fallback();
    }
  }

  function fill(el, text) {
    el.querySelector('.jp-btip-text b').textContent = text.title;
    el.querySelector('.jp-btip-text span').textContent = text.body;
  }

  function show(text, alarm) {
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'jp-btip';
      bar.setAttribute('role', 'alert');
      bar.innerHTML = '<span class="jp-btip-badge">!</span>'
        + '<div class="jp-btip-text"><b></b><span></span></div>'
        + '<div class="jp-btip-acts">'
        + '<button type="button" class="jp-btip-primary">复制网址</button>'
        + '<button type="button" class="jp-btip-close">知道了</button>'
        + '</div>';
      bar.querySelector('.jp-btip-close').addEventListener('click', hide);
      bar.querySelector('.jp-btip-primary').addEventListener('click', ev => copyUrl(ev.currentTarget));
      document.body.appendChild(bar);
      document.documentElement.classList.add('jp-btip-on');
      addEventListener('resize', syncHeight);
    }
    bar.classList.toggle('jp-btip-alarm', !!alarm);
    fill(bar, text);
    syncHeight();
  }

  function hide() {
    store(DISMISS_KEY, '1');
    removeBar();
  }

  function removeBar() {
    try { document.documentElement.classList.remove('jp-btip-on'); } catch (e) { }
    if (bar) { bar.remove(); bar = null; }
  }

  function warnNoVoice(onProceed, engineFailed) {
    if (stored(SILENT_KEY)) { if (onProceed) onProceed(); return; }
    const plat = platform();
    let head = '这台浏览器没有日语语音，读不出声';
    let ps = '<p>Edge 自带七海、圭太，不用另装语音包。</p>'
      + '<p>复制网址，粘贴到 Edge 里打开：</p>';
    if (engineFailed) {
      if (plat === 'android') {
        head = '手机有日语语音，但没有出声';
        ps = '<p>语音列表里有日语，引擎却没出声。重启手机再试，或换 Safari、Edge：</p>';
      } else {
        head = '朗读引擎没有出声';
        ps = '<p>刷新这一页。还是不行，就复制网址到 Edge 打开：</p>';
      }
    } else if (plat === 'android') {
      head = '这台手机没有日语语音，读不出声';
      ps = '<p>设置 → 语言和输入法 → 文字转语音，选 Google 文字转语音，下载日语。装过就重启手机。</p>'
        + '<p>也可以复制网址，用 Safari 打开：</p>';
    } else if (plat === 'ios') {
      head = '用 Safari 打开这一页';
      ps = '<p>iPhone 上的 Chrome、Firefox 读得不完整。Safari 可以。</p>'
        + '<p>把网址复制到 Safari：</p>';
    }
    const mask = document.createElement('div');
    mask.className = 'jp-btip-mask';
    mask.innerHTML = '<div class="jp-btip-card" role="dialog" aria-modal="true">'
      + '<h3></h3>' + ps
      + '<div class="jp-btip-url"></div>'
      + '<p class="jp-btip-diag"></p>'
      + '<div class="jp-btip-row">'
      + '<button type="button" class="jp-btip-copy">复制网址</button>'
      + '<button type="button" class="jp-btip-proceed">仍要播放</button>'
      + '<button type="button" class="jp-btip-primary jp-btip-done">关闭</button>'
      + '</div></div>';
    mask.querySelector('h3').textContent = head;
    mask.querySelector('.jp-btip-diag').textContent = canSpeak()
      ? '本机语音：共 ' + speechSynthesis.getVoices().length + ' 个，日语 ' + jaVoices().length + ' 个'
      : '这个浏览器不支持语音合成';
    mask.querySelector('.jp-btip-url').textContent = location.href;
    const close = () => mask.remove();
    mask.querySelector('.jp-btip-done').addEventListener('click', close);
    mask.querySelector('.jp-btip-copy').addEventListener('click', ev => copyUrl(ev.currentTarget));
    mask.querySelector('.jp-btip-proceed').addEventListener('click', () => {
      store(SILENT_KEY, '1');
      close();
      if (onProceed) onProceed();
    });
    if (!onProceed) mask.querySelector('.jp-btip-proceed').style.display = 'none';
    mask.addEventListener('click', ev => { if (ev.target === mask) close(); });
    document.body.appendChild(mask);
  }

  function onVoicesChanged() {
    if (stored(DISMISS_KEY) || !hasJaVoice()) return;
    const plat = platform();
    if (plat === 'android' || (plat === 'desktop' && isEdge())
      || (plat === 'ios' && isSafariOnIOS())) removeBar();
    else if (plat === 'desktop' && bar) show(GENERAL, false);
  }

  function watchVoices(maxTries, alarmText) {
    if (stored(DISMISS_KEY) || !canSpeak()) return;
    let tries = 0;
    const tick = () => {
      if (stored(DISMISS_KEY)) return;
      if (hasJaVoice()) { onVoicesChanged(); return; }
      if (++tries >= maxTries) { show(alarmText, true); return; }
      setTimeout(tick, 250);
    };
    setTimeout(tick, 250);
    try {
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      else speechSynthesis.onvoiceschanged = onVoicesChanged;
    } catch (e) { }
  }

  function init() {
    if (stored(DISMISS_KEY)) return;
    const plat = platform();
    if (!canSpeak()) {
      show(plat === 'android' ? NO_SUPPORT_ANDROID : NO_SUPPORT, true);
      return;
    }
    if (plat === 'ios') {
      if (isSafariOnIOS()) watchVoices(8, ALARM_IOS);
      else show(SAFARI_IOS, false);
      return;
    }
    if (plat === 'android') { watchVoices(24, ALARM_ANDROID); return; }
    if (!isEdge()) show(GENERAL, false);
    watchVoices(6, isEdge() ? ALARM_EDGE : ALARM);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { hasJaVoice, isEdge, warnNoVoice };
})();
