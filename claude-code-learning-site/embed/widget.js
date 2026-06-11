/**
 * ══════════════════════════════════════════════════════
 * 方案C：JS Widget — 一行代码嵌入课程推荐卡片
 * 版本: 1.0.0
 * ══════════════════════════════════════════════════════
 *
 * 使用方法：
 * <script src="https://www.hcpthanks.com/embed/widget.js"></script>
 *
 * 可选配置（通过 data-* 属性）：
 * <script src="https://www.hcpthanks.com/embed/widget.js"
 *         data-style="banner"    ← banner | square | float (默认banner)
 *         data-text="AI帮你干活"  ← 自定义标题
 *         data-theme="dark"      ← dark | light
 * ></script>
 *
 * 指定渲染位置（可选，默认渲染在 script 标签所在位置）：
 * <div id="hcpthanks-widget"></div>
 * <script src="..." data-target="#hcpthanks-widget"></script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  // ── 读取配置 ──
  var style = script.getAttribute('data-style') || 'banner';
  var text = script.getAttribute('data-text') || 'AI 帮你干活';
  var theme = script.getAttribute('data-theme') || 'dark';
  var target = script.getAttribute('data-target');
  var siteUrl = 'https://www.hcpthanks.com';

  // ── 根据 style 生成 HTML ──
  var html = '';
  var isDark = theme === 'dark';

  var colors = {
    bg: isDark ? '#161b22' : '#ffffff',
    border: isDark ? '#30363d' : '#d0d7de',
    title: isDark ? '#e6edf3' : '#1f2328',
    desc: isDark ? '#8b949e' : '#656d76',
    btn: '#238636',
    btnText: '#ffffff',
    accent: '#58a6ff',
  };

  if (style === 'square') {
    html =
      '<a href="' + siteUrl + '" target="_blank" rel="noopener" style="' +
      'display:block;width:280px;padding:24px;' +
      'background:' + colors.bg + ';border:1px solid ' + colors.border + ';border-radius:16px;' +
      'text-decoration:none;font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;' +
      'transition:transform 0.2s,box-shadow 0.2s;' +
      '" onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 30px rgba(88,166,255,0.15)\'"' +
      ' onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'none\'">' +
      '<div style="font-size:2.5em;margin-bottom:12px;">🔥</div>' +
      '<div style="font-size:1.15em;font-weight:700;color:' + colors.title + ';margin-bottom:8px;">' + text + '</div>' +
      '<div style="font-size:0.85em;color:' + colors.desc + ';line-height:1.7;margin-bottom:16px;">不用写代码<br>不用学英语<br>从开机开始教</div>' +
      '<div style="padding:10px 0;text-align:center;background:' + colors.btn + ';color:' + colors.btnText + ';border-radius:8px;font-size:0.9em;font-weight:600;">👉 免费开始学</div>' +
      '</a>';
  } else if (style === 'float') {
    var floatCss =
      '.hcpthanks-w-float{' +
      'position:fixed;bottom:24px;right:24px;z-index:9999;' +
      'display:flex;align-items:center;gap:10px;padding:12px 18px;' +
      'background:' + colors.bg + ';border:1px solid ' + colors.border + ';border-radius:30px;' +
      'text-decoration:none;font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;' +
      'box-shadow:0 4px 20px rgba(0,0,0,0.4);transition:transform 0.2s;' +
      'animation:hct-bounce 2s ease-in-out 3}' +
      '.hcpthanks-w-float:hover{transform:translateY(-3px)}' +
      '@keyframes hct-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
      '@media(max-width:600px){.hcpthanks-w-float{padding:10px 14px;bottom:16px;right:16px}}';
    var styleEl = document.createElement('style');
    styleEl.textContent = floatCss;
    document.head.appendChild(styleEl);

    html =
      '<a href="' + siteUrl + '" target="_blank" rel="noopener" class="hcpthanks-w-float">' +
      '<span style="font-size:1.5em">🔥</span>' +
      '<span style="font-size:0.82em;font-weight:700;color:' + colors.title + '">' + text + ' · 免费学</span>' +
      '<span style="color:#58a6ff">→</span></a>';
  } else {
    // default: banner
    html =
      '<a href="' + siteUrl + '" target="_blank" rel="noopener" style="' +
      'display:flex;align-items:center;gap:16px;max-width:600px;padding:16px 20px;' +
      'background:' + colors.bg + ';border:1px solid ' + colors.border + ';border-radius:12px;' +
      'text-decoration:none;font-family:-apple-system,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;' +
      'transition:border-color 0.2s;' +
      '" onmouseover="this.style.borderColor=\'#58a6ff\'"' +
      ' onmouseout="this.style.borderColor=\'' + colors.border + '\'">' +
      '<span style="font-size:2em;flex-shrink:0;">🔥</span>' +
      '<span style="flex:1;">' +
      '<span style="display:block;font-size:1.05em;font-weight:700;color:' + colors.title + ';">' + text + '</span>' +
      '<span style="display:block;font-size:0.82em;color:' + colors.desc + ';margin-top:2px;">不用写代码，不用学英语 · 从开机开始教</span>' +
      '</span>' +
      '<span style="flex-shrink:0;padding:8px 16px;background:' + colors.btn + ';color:' + colors.btnText + ';border-radius:6px;font-size:0.85em;font-weight:600;">免费学 →</span>' +
      '</a>';
  }

  // ── 渲染 ──
  var container;
  if (target) {
    container = document.querySelector(target);
  }
  if (!container) {
    container = document.createElement('div');
    script.parentNode.insertBefore(container, script);
  }
  container.innerHTML = html;
})();
