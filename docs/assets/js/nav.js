/* ═══════════════════════════════════════════════════════
   Shared Navigation — 一处修改，全站生效
   ═══════════════════════════════════════════════════════ */

/* ══════ Shared Topic Registry (single source of truth) ══════ */
window.TOPIC_ORDER  = [
  'pc-basics', 'open-ps', 'install-cc', 'first-chat', 'file-basics', 'troubleshoot',
  'intro', 'plan', 'shortcuts', 'convo', 'init', 'workflow'
];

window.TOPIC_NAMES  = {
  'pc-basics': '认识你的电脑', 'open-ps': '打开 PowerShell',
  'install-cc': '安装 Claude Code', 'first-chat': '第一次对话',
  'file-basics': '文件与文件夹', 'troubleshoot': '遇到错误怎么办',
  intro: 'Claude Code 简介', plan: '/plan 命令完全指南',
  shortcuts: '快捷键大全', convo: '对话技巧入门',
  init: '项目初始化', workflow: '日常工作流'
};

window.TOPIC_PAGES  = {
  'pc-basics': 'computer-basics.html', 'open-ps': 'open-powershell.html',
  'install-cc': 'install-claude-code.html', 'first-chat': 'first-conversation.html',
  'file-basics': 'file-basics.html', 'troubleshoot': 'when-things-go-wrong.html',
  intro: 'claude-intro.html', plan: 'plan-guide.html',
  shortcuts: 'shortcuts.html', convo: 'conversation-skills.html',
  init: 'project-init.html', workflow: 'daily-workflow.html'
};

/* ══════ Directory prefixes ══════ */
var PRE_DIR = 'pre-basics/';
var BEG_DIR = 'beginner/';

function topicPagePath(topicId) {
  var page = window.TOPIC_PAGES[topicId];
  if (!page) return '#';
  if (window.TOPIC_ORDER.indexOf(topicId) < 6) return '../' + PRE_DIR + page;
  return '../' + BEG_DIR + page;
}

/* ══════ Nav Build ══════ */
var NAV_PAGES = [
  { id: 'pc-basics',     href: topicPagePath('pc-basics'),     label: '认识电脑' },
  { id: 'open-ps',       href: topicPagePath('open-ps'),       label: '开 PowerShell' },
  { id: 'install-cc',    href: topicPagePath('install-cc'),    label: '安装 CC' },
  { id: 'first-chat',    href: topicPagePath('first-chat'),    label: '第一次对话' },
  { id: 'file-basics',   href: topicPagePath('file-basics'),   label: '文件基础' },
  { id: 'troubleshoot',  href: topicPagePath('troubleshoot'),  label: '遇到错误' },
  { id: 'intro',         href: topicPagePath('intro'),         label: '简介' },
  { id: 'plan',          href: topicPagePath('plan'),          label: '/plan 指南' },
  { id: 'shortcuts',     href: topicPagePath('shortcuts'),     label: '快捷键' },
  { id: 'convo',         href: topicPagePath('convo'),         label: '对话技巧' },
  { id: 'init',          href: topicPagePath('init'),          label: '项目初始化' },
  { id: 'workflow',      href: topicPagePath('workflow'),      label: '工作流' }
];

function renderNav(activeId) {
  var links = NAV_PAGES.map(function(p) {
    return '<a href="' + p.href + '"' + (p.id === activeId ? ' class="active"' : '') + '>' + p.label + '</a>';
  }).join('\n        ');

  return '\n<nav class="site-nav" aria-label="主导航">\n' +
    '  <div class="nav-inner">\n' +
    '    <a href="../index.html" class="logo">Claude Code <span>学习站</span></a>\n' +
    '    <div class="nav-links" role="navigation" aria-label="课程导航">\n' +
    '      <a href="../index.html">首页</a>\n' +
    '      <a href="../index.html#pre-basics">预备课</a>\n' +
    '      <a href="../index.html#beginner">入门</a>\n' +
    '      ' + links + '\n' +
    '    </div>\n' +
    '    <a href="../pay/pay.html" class="nav-cta">升级</a>\n' +
    '  </div>\n' +
    '</nav>';
}
