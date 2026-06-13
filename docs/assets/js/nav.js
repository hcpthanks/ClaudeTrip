/* ═══════════════════════════════════════════════════════
   Shared Navigation — 一处修改，全站生效
   ═══════════════════════════════════════════════════════ */

/* ══════ Shared Topic Registry (single source of truth) ══════ */
window.TOPIC_ORDER  = [
  'pc-basics', 'open-ps', 'install-cc', 'first-chat', 'file-basics', 'troubleshoot', 'deepseek',
  'ai-for-business', 'talk-to-ai', 'ai-writing', 'bridge-to-coding',
  'intro', 'plan', 'shortcuts', 'convo', 'init', 'workflow',
  'core-commands', 'context-cost', 'workflow-patterns', '21-day-plan'
];

/* ══════ 激活码永久编号系统 ══════
   字符表31个（去I/O/0/1），3字符编码 = 31³ = 29791个主题
   编号永久不变——插入新课不影响已有激活码 */
window.ACT_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// topicId → 永久编号（生成时用）
window.TOPIC_IDS = {
  'pc-basics':1,'open-ps':2,'install-cc':3,'first-chat':4,'file-basics':5,'troubleshoot':6,'deepseek':7,
  'ai-for-business':8,'talk-to-ai':9,'ai-writing':10,'bridge-to-coding':11,
  'intro':12,'plan':13,'shortcuts':14,'convo':15,'init':16,'workflow':17,
  'core-commands':18,'context-cost':19,'workflow-patterns':20,'21-day-plan':21
};

// 永久编号 → topicId（验证时用）
window.TOPIC_BY_ID = {};
Object.keys(window.TOPIC_IDS).forEach(function(k) { window.TOPIC_BY_ID[window.TOPIC_IDS[k]] = k; });

// 3字符编码 编号 → 字符串
window.encodeTopicId = function(id) {
  var n = id - 1;
  return window.ACT_CHARS[Math.floor(n / 961)]
       + window.ACT_CHARS[Math.floor((n % 961) / 31)]
       + window.ACT_CHARS[n % 31];
};

// 3字符解码 字符串 → 编号
window.decodeTopicId = function(code) {
  return window.ACT_CHARS.indexOf(code[0]) * 961
       + window.ACT_CHARS.indexOf(code[1]) * 31
       + window.ACT_CHARS.indexOf(code[2]) + 1;
};

window.TOPIC_NAMES  = {
  'pc-basics': '认识你的电脑', 'open-ps': '打开 PowerShell',
  'install-cc': '安装 Claude Code', 'first-chat': '第一次对话',
  'file-basics': '文件与文件夹', 'troubleshoot': '遇到错误怎么办',
  'deepseek': '国内也能用',
  'ai-for-business': 'AI 能帮你做什么', 'talk-to-ai': '让 AI 听懂你',
  'ai-writing': '让 AI 帮你写文案', 'bridge-to-coding': 'AI帮你管好客户',
  intro: '认识 Claude Code', plan: '做事之前先想清楚',
  shortcuts: '快捷键大全', convo: '让AI听懂你的话',
  init: '第一次让AI帮你做事', workflow: '每天都能用的AI场景',
  'core-commands': '核心命令精通', 'context-cost': '上下文与成本管理',
  'workflow-patterns': '每日工作流实战', '21-day-plan': '21天进阶计划'
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
  init: 'project-init.html', workflow: 'daily-workflow.html',
  'core-commands': 'core-commands.html', 'context-cost': 'context-cost.html',
  'workflow-patterns': 'workflow-patterns.html', '21-day-plan': '21-day-plan.html'
};

/* ══════ Directory prefixes ══════ */
var PRE_DIR = 'pre-basics/';
var APP_DIR = 'applied/';
var BEG_DIR = 'beginner/';
var INT_DIR = 'intermediate/';

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

/* ══════ Four-tier routing: pre-basics(0-6) → applied(7-10) → beginner(11-16) → intermediate(17-20) ══════ */
function topicPagePath(topicId) {
  var page = window.TOPIC_PAGES[topicId];
  if (!page) return '#';
  var idx = window.TOPIC_ORDER.indexOf(topicId);
  if (idx < 7) return '../' + PRE_DIR + page;
  if (idx < 11) return '../' + APP_DIR + page;
  if (idx < 17) return '../' + BEG_DIR + page;
  return '../' + INT_DIR + page;
}
window.topicPagePath = topicPagePath;

/* ══════ Nav Build — 简洁模式：只显示分区链接 ══════ */
function renderNav(activeId) {
  // 当前主题所属分区高亮
  var idx = window.TOPIC_ORDER.indexOf(activeId);
  var section = idx < 0 ? '' : idx < 7 ? 'pre-basics' : idx < 11 ? 'applied' : idx < 17 ? 'beginner' : 'intermediate';

  return '\n<nav class="site-nav" aria-label="主导航">\n' +
    '  <div class="nav-inner">\n' +
    '    <a href="../index.html" class="logo">Claude Code <span>学习站</span></a>\n' +
    '    <div class="nav-links" role="navigation" aria-label="课程导航">\n' +
    '      <a href="../index.html">首页</a>\n' +
    '      <a href="../index.html#pre-basics"' + (section === 'pre-basics' ? ' class="active"' : '') + '>预备课</a>\n' +
    '      <a href="../index.html#applied"'    + (section === 'applied'    ? ' class="active"' : '') + '>应用课</a>\n' +
    '      <a href="../index.html#beginner"'   + (section === 'beginner'   ? ' class="active"' : '') + '>入门</a>\n' +
    '      <a href="../index.html#intermediate"' + (section === 'intermediate' ? ' class="active"' : '') + '>进阶</a>\n' +
    '    </div>\n' +
    '    <a href="../pay/recover.html" class="nav-recover">🔑 激活码</a>\n' +
    '    <a href="../pay/pay.html" class="nav-cta">支付</a>\n' +
    '    <button class="nav-toggle" id="nav-toggle" aria-label="菜单">\n' +
    '      <span></span><span></span><span></span>\n' +
    '    </button>\n' +
    '  </div>\n' +
    '  <div class="mobile-menu" id="mobile-menu">\n' +
    '    <a href="../index.html">🏠 首页</a>\n' +
    '    <a href="../index.html#pre-basics">🖥️ 预备课</a>\n' +
    '    <a href="../index.html#applied">💼 应用课</a>\n' +
    '    <a href="../index.html#beginner">🌱 入门</a>\n' +
    '    <a href="../index.html#intermediate">⚡ 进阶</a>\n' +
    '    <a href="../pay/recover.html">🔑 激活码</a>\n' +
    '    <a href="../pay/pay.html" class="mobile-cta">⚡ 支付</a>\n' +
    '  </div>\n' +
  '</nav>';
}

/* ══════ Mobile Menu Toggle ══════ */
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById("nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.classList.toggle("open");
    document.body.style.overflow = open ? "hidden" : "";
  });
  // Close on link click
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
});
