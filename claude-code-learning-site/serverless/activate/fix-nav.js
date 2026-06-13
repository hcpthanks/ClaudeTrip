'use strict';
var fs = require('fs');
var c = fs.readFileSync('../../assets/js/nav.js', 'utf8');

// Find the renderNav return statement
var marker = "return '\\n<nav class=\"site-nav\" aria-label=\"主导航\">\\n' +";
var idx = c.indexOf(marker);
if (idx < 0) {
  console.log('Marker not found, trying alternative...');
  marker = "return '";
  idx = c.indexOf(marker, c.indexOf('function renderNav'));
  if (idx < 0) { console.log('Still not found'); process.exit(1); }
}

// Find the end (after </nav>';)
var endMarker = "</nav>';";
var endIdx = c.indexOf(endMarker, idx);
if (endIdx < 0) { console.log('End not found'); process.exit(1); }
endIdx += endMarker.length;

var newHTML =
  "return '\\n<nav class=\"site-nav\" aria-label=\"主导航\">\\n' +\n" +
  "    '  <div class=\"nav-inner\">\\n' +\n" +
  "    '    <a href=\"../index.html\" class=\"logo\">Claude Code <span>学习站</span></a>\\n' +\n" +
  "    '    <div class=\"nav-links\" role=\"navigation\" aria-label=\"课程导航\">\\n' +\n" +
  "    '      <a href=\"../index.html\">首页</a>\\n' +\n" +
  "    '      <a href=\"../index.html#pre-basics\"' + (section === 'pre-basics' ? ' class=\"active\"' : '') + '>预备课</a>\\n' +\n" +
  "    '      <a href=\"../index.html#applied\"'    + (section === 'applied'    ? ' class=\"active\"' : '') + '>应用课</a>\\n' +\n" +
  "    '      <a href=\"../index.html#beginner\"'   + (section === 'beginner'   ? ' class=\"active\"' : '') + '>入门</a>\\n' +\n" +
  "    '    </div>\\n' +\n" +
  "    '    <a href=\"../pay/pay.html\" class=\"nav-cta\">升级</a>\\n' +\n" +
  "    '    <button class=\"nav-toggle\" id=\"nav-toggle\" aria-label=\"菜单\">\\n' +\n" +
  "    '      <span></span><span></span><span></span>\\n' +\n" +
  "    '    </button>\\n' +\n" +
  "    '  </div>\\n' +\n" +
  "    '  <div class=\"mobile-menu\" id=\"mobile-menu\">\\n' +\n" +
  "    '    <a href=\"../index.html\">🏠 首页</a>\\n' +\n" +
  "    '    <a href=\"../index.html#pre-basics\">🖥️ 预备课</a>\\n' +\n" +
  "    '    <a href=\"../index.html#applied\">💼 应用课</a>\\n' +\n" +
  "    '    <a href=\"../index.html#beginner\">🌱 入门</a>\\n' +\n" +
  "    '    <a href=\"../pay/pay.html\" class=\"mobile-cta\">⚡ 升级</a>\\n' +\n" +
  "    '  </div>\\n' +\n" +
  "  '</nav>';";

c = c.substring(0, idx) + newHTML + c.substring(endIdx);

// Now add hamburger toggle JS at the end
var toggleJS = '\n' +
  '/* ══════ Mobile Menu Toggle ══════ */\n' +
  '(function () {\n' +
  '  var toggle = document.getElementById("nav-toggle");\n' +
  '  var menu = document.getElementById("mobile-menu");\n' +
  '  if (!toggle || !menu) return;\n' +
  '  toggle.addEventListener("click", function () {\n' +
  '    var open = menu.classList.toggle("open");\n' +
  '    toggle.classList.toggle("open");\n' +
  '    document.body.style.overflow = open ? "hidden" : "";\n' +
  '  });\n' +
  '  // Close on link click\n' +
  '  menu.querySelectorAll("a").forEach(function (a) {\n' +
  '    a.addEventListener("click", function () {\n' +
  '      menu.classList.remove("open");\n' +
  '      toggle.classList.remove("open");\n' +
  '      document.body.style.overflow = "";\n' +
  '    });\n' +
  '  });\n' +
  '})();\n';

c += toggleJS;

fs.writeFileSync('../../assets/js/nav.js', c);
console.log('Updated nav.js with hamburger menu + toggle JS');
