/* ═══════════════════════════════════════════════════════
   Shared Navigation — 一处修改，全站生效
   ═══════════════════════════════════════════════════════ */

/* ══════ Shared Topic Registry (single source of truth) ══════ */
window.TOPIC_ORDER  = [
  'pc-basics', 'open-ps', 'install-cc', 'first-chat', 'file-basics', 'troubleshoot', 'deepseek',
  'ai-for-business', 'talk-to-ai', 'ai-writing', 'bridge-to-coding',
  'intro', 'plan', 'shortcuts', 'convo', 'init', 'workflow'
];

window.TOPIC_NAMES  = {
  'pc-basics': '认识你的电脑', 'open-ps': '打开 PowerShell',
  'install-cc': '安装 Claude Code', 'first-chat': '第一次对话',
  'file-basics': '文件与文件夹', 'troubleshoot': '遇到错误怎么办',
  'deepseek': '国内也能用',
  'ai-for-business': 'AI 能帮你做什么', 'talk-to-ai': '让 AI 听懂你',
  'ai-writing': '让 AI 帮你写文案', 'bridge-to-coding': '接下来学什么',
  intro: 'Claude Code 简介', plan: '/plan 命令完全指南',
  shortcuts: '快捷键大全', convo: '对话技巧入门',
  init: '项目初始化', workflow: '日常工作流'
};

window.TOPIC_PAGES  = {
  'pc-basics': 'computer-basics.html', 'open-ps': 'open-powershell.html',
  'install-cc': 'install-claude-code.html', 'first-chat': 'first-conversation.html',
  'file-basics': 'file-basics.html', 'troubleshoot': 'when-things-go-wrong.html',
  'deepseek': 'deepseek-setup.html',
  'ai-for-business': 'ai-for-business.html', 'talk-to-ai': 'talk-to-ai.html',
  'ai-writing': 'ai-writing.html', 'bridge-to-coding': 'bridge-to-coding.html',
  intro: 'claude-intro.html', plan: 'plan-guide.html',
  shortcuts: 'shortcuts.html', convo: 'conversation-skills.html',
  init: 'project-init.html', workflow: 'daily-workflow.html'
};

/* ══════ Directory prefixes ══════ */
var PRE_DIR = 'pre-basics/';
var APP_DIR = 'applied/';
var BEG_DIR = 'beginner/';

/* ══════ Module Nav Scroll Tracking ══════ */
(function () {
  var nav = document.querySelector('.module-nav');
  if (!nav) return;
  var links = nav.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  // Build a map: id → link element
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    map[id] = a;
  });

  // Observe all target sections
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = map[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        // Remove active from all, add to current
        links.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
        // Scroll link into view if needed
        link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) observer.observe(el);
  });
})();

/* ══════ Three-tier routing: pre-basics(0-6) → applied(7-10) → beginner(11+) ══════ */
function topicPagePath(topicId) {
  var page = window.TOPIC_PAGES[topicId];
  if (!page) return '#';
  var idx = window.TOPIC_ORDER.indexOf(topicId);
  if (idx < 7) return '../' + PRE_DIR + page;
  if (idx < 11) return '../' + APP_DIR + page;
  return '../' + BEG_DIR + page;
}
window.topicPagePath = topicPagePath;

/* ══════ Nav Build — 简洁模式：只显示分区链接 ══════ */
function renderNav(activeId) {
  // 当前主题所属分区高亮
  var idx = window.TOPIC_ORDER.indexOf(activeId);
  var section = idx < 0 ? '' : idx < 7 ? 'pre-basics' : idx < 11 ? 'applied' : 'beginner';

  return '\n<nav class="site-nav" aria-label="主导航">\n' +
    '  <div class="nav-inner">\n' +
    '    <a href="../index.html" class="logo">Claude Code <span>学习站</span></a>\n' +
    '    <div class="nav-links" role="navigation" aria-label="课程导航">\n' +
    '      <a href="../index.html">首页</a>\n' +
    '      <a href="../index.html#pre-basics"' + (section === 'pre-basics' ? ' class="active"' : '') + '>预备课</a>\n' +
    '      <a href="../index.html#applied"'    + (section === 'applied'    ? ' class="active"' : '') + '>应用课</a>\n' +
    '      <a href="../index.html#beginner"'   + (section === 'beginner'   ? ' class="active"' : '') + '>入门</a>\n' +
    '    </div>\n' +
    '    <a href="../pay/pay.html" class="nav-cta">升级</a>\n' +
    '  </div>\n' +
    '</nav>';
}
