/* ---------- 浏览器提示：朗读只在 Edge 完整可用（Chrome 常缺日语语音，Firefox 音色少） ---------- */
const BROWSER_TIP = (() => {
  const DISMISS_KEY = 'jp-btip-dismissed';
  const SILENT_KEY = 'jp-btip-allow-silent';
  const GENERAL = {
    title: '建议用 Edge 浏览器打开：Chrome / Firefox 的朗读可能没有声音',
    body: 'Chrome 通常没有日语语音包，Firefox 可选音色很少。Edge 自带「七海」「圭太」等自然日语发音。'
  };
  const ALARM = {
    title: '当前浏览器没有可用的日语语音，朗读不会有声音',
    body: '复制本页网址，粘贴到 Edge 地址栏打开即可正常朗读。'
  };
  const ALARM_EDGE = {
    title: 'Edge 没有加载到日语语音，朗读暂时没有声音',
    body: 'Edge 的日语语音需要联网加载，请检查网络后刷新本页。'
  };
  const ALARM_ANDROID = {
    title: '这台手机没有可用的日语语音，朗读不会有声音',
    body: '到系统设置安装日语语音：设置 → 语言和输入法 → 文字转语音，选择 Google 文字转语音并下载日语数据，然后刷新本页；已经装过就重启手机再试。'
  };
  const SAFARI_IOS = {
    title: '请用 Safari 打开本页',
    body: 'iPhone / iPad 上的 Chrome、Firefox 朗读支持不完整；Safari 可以正常朗读。复制本页网址，粘贴到 Safari 打开。'
  };
  const ALARM_IOS = {
    title: 'Safari 没有加载到日语语音，朗读不会有声音',
    body: '到「设置 → 辅助功能 → 朗读内容 → 声音 → 日语」下载日语语音，然后刷新本页。'
  };
  const NO_SUPPORT = {
    title: '当前浏览器不支持朗读',
    body: '请复制网址，用电脑 Edge 或 iPhone / iPad 的 Safari 打开。'
  };
  const NO_SUPPORT_ANDROID = {
    title: '这个浏览器不支持朗读',
    body: '请用 Chrome 或手机自带的浏览器打开本页；也可以复制网址，到 iPhone / iPad 的 Safari 或电脑 Edge 打开。'
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
    let head = '这台浏览器没有日语语音，朗读不会有声音';
    let ps = '<p>Edge 浏览器自带「七海」「圭太」等日语发音，不需要另外安装语音包。</p>'
      + '<p>复制下面的网址，粘贴到 Edge 地址栏打开：</p>';
    if (engineFailed) {
      if (plat === 'android') {
        head = '手机的日语语音没能启动，朗读没有声音';
        ps = '<p>语音列表里能看到日语（见下方），但系统语音引擎没有发声。可以重启手机后再试，或换用 iPhone / iPad 的 Safari、电脑 Edge 打开：</p>';
      } else {
        head = '浏览器的朗读引擎没能出声';
        ps = '<p>请刷新页面再试，或复制下面的网址到 Edge 打开：</p>';
      }
    } else if (plat === 'android') {
      head = '这台手机没有日语语音，朗读不会有声音';
      ps = '<p>到系统设置安装日语语音：<b>设置 → 语言和输入法 → 文字转语音</b>，选择 Google 文字转语音，下载日语语音数据，然后刷新本页；已经装过就重启手机再试。</p>'
        + '<p>也可以用 iPhone / iPad 的 Safari 打开：</p>';
    } else if (plat === 'ios') {
      head = '请用 Safari 打开本页';
      ps = '<p>iPhone / iPad 上的 Chrome、Firefox 朗读支持不完整；Safari 可以正常朗读。</p>'
        + '<p>把下面的网址复制到 Safari：</p>';
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
      ? '本机语音引擎：共 ' + speechSynthesis.getVoices().length + ' 个语音，其中日语 ' + jaVoices().length + ' 个'
      : '本机浏览器不支持语音合成';
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
