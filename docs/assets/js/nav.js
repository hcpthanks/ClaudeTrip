/* ═══════════════════════════════════════════════════════
   Shared Navigation — 一处修改，全站生效
   ═══════════════════════════════════════════════════════ */

/* ══════ Shared Topic Registry (single source of truth) ══════ */
window.TOPIC_ORDER  = ['intro', 'plan', 'shortcuts', 'convo', 'init', 'workflow'];

window.TOPIC_NAMES  = {
  intro: 'Claude Code 简介', plan: '/plan 命令完全指南',
  shortcuts: '快捷键大全', convo: '对话技巧入门',
  init: '项目初始化', workflow: '日常工作流'
};

window.TOPIC_PAGES  = {
  intro: 'claude-intro.html', plan: 'plan-guide.html',
  shortcuts: 'shortcuts.html', convo: 'conversation-skills.html',
  init: 'project-init.html', workflow: 'daily-workflow.html'
};

/* ══════ Nav Build ══════ */
const NAV_PAGES = [
  { id: 'intro',      href: 'claude-intro.html',         label: '简介' },
  { id: 'plan',       href: 'plan-guide.html',           label: '/plan 指南' },
  { id: 'shortcuts',  href: 'shortcuts.html',            label: '快捷键' },
  { id: 'convo',      href: 'conversation-skills.html',  label: '对话技巧' },
  { id: 'init',       href: 'project-init.html',         label: '项目初始化' },
  { id: 'workflow',   href: 'daily-workflow.html',       label: '工作流' },
];

function renderNav(activeId) {
  const links = NAV_PAGES.map(p =>
    `<a href="${p.href}"${p.id === activeId ? ' class="active"' : ''}>${p.label}</a>`
  ).join('\n        ');

  return `
<nav class="site-nav" aria-label="主导航">
  <div class="nav-inner">
    <a href="../index.html" class="logo">Claude Code <span>学习站</span></a>
    <div class="nav-links" role="navigation" aria-label="课程导航">
      <a href="../index.html">首页</a>
      <a href="../index.html#beginner">入门</a>
      ${links}
    </div>
    <a href="../pay/pay.html" class="nav-cta">升级</a>
  </div>
</nav>`;
}
