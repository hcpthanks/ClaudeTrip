# -*- coding: utf-8 -*-
"""把 learned/ 下的 markdown 经验条目渲染成一个可浏览的 index.html。

用法：python _make_index.py
生成的 index.html 内嵌全部正文，直接双击就能看，不依赖网络和本地服务器。
"""

import json
import re
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent


def split_front_matter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end < 0:
        return {}, text
    block = text[3:end].strip()
    body = text[end + 4:].lstrip("\n")
    meta = {}
    for line in block.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        meta[k.strip()] = v.strip().strip('"').strip("'")
    return meta, body


def title_of(meta: dict, body: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+)$", body, re.M)
    if m:
        return m.group(1).strip()
    return meta.get("name") or fallback


def collect() -> list[dict]:
    items = []
    for p in sorted(HERE.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        meta, body = split_front_matter(text)
        title = title_of(meta, body, p.stem)
        lines = body.splitlines()
        if lines and lines[0].startswith("# ") and lines[0][2:].strip() == title:
            body = "\n".join(lines[1:]).lstrip("\n")
        items.append(
            {
                "file": p.name,
                "title": title,
                "desc": meta.get("description", ""),
                "body": body,
                "mtime": datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d"),
                "order": p.stat().st_mtime,
            }
        )
    items.sort(key=lambda x: x["order"], reverse=True)
    return items


TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>经验教训库 — 复习</title>
<style>
:root{
  --bg:#f7f4ee; --panel:#fffdf8; --ink:#26221c; --soft:#5b5347; --muted:#8d8375;
  --line:#e6ddcd; --accent:#a8443a; --code:#f1ece1; --hl:#f6e7d8;
}
html.dark{
  --bg:#1b1916; --panel:#232019; --ink:#ece5d8; --soft:#c3b9a8; --muted:#8f8677;
  --line:#3a352c; --accent:#d8796d; --code:#2b271f; --hl:#3a2f24;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.9 system-ui,-apple-system,"Microsoft YaHei","PingFang SC",sans-serif}
a{color:var(--accent)}
.layout{display:flex;min-height:100vh}
aside{width:300px;flex:none;background:var(--panel);border-right:1px solid var(--line);
  display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.side-head{padding:18px 18px 12px;border-bottom:1px solid var(--line)}
.side-head h1{font:600 17px/1.4 "Yu Mincho","Noto Serif SC",serif;margin:0 0 4px;letter-spacing:.04em}
.side-head p{margin:0;color:var(--muted);font-size:12px}
.tools{display:flex;gap:8px;margin-top:12px}
.tools input{flex:1;min-width:0;height:34px;padding:0 10px;border:1px solid var(--line);
  border-radius:8px;background:var(--bg);color:var(--ink);font:13px/1 inherit}
.tools input:focus{outline:2px solid var(--accent);outline-offset:1px}
.tools button{width:34px;height:34px;border:1px solid var(--line);border-radius:8px;
  background:var(--bg);color:var(--soft);cursor:pointer;font-size:14px}
.list{overflow:auto;flex:1;padding:8px}
.item{display:block;padding:10px 12px;border-radius:9px;text-decoration:none;color:inherit;cursor:pointer}
.item:hover{background:var(--hl)}
.item.on{background:var(--hl);box-shadow:inset 3px 0 0 var(--accent)}
.item b{display:block;font:600 14px/1.5 "Yu Mincho","Noto Serif SC",serif;margin-bottom:2px}
.item span{display:block;color:var(--muted);font-size:11.5px;line-height:1.5;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
main{flex:1;min-width:0;padding:34px clamp(20px,4vw,56px) 80px}
.doc{max-width:780px;margin:0 auto}
.doc-head{border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:24px}
.doc-head h2{font:600 28px/1.5 "Yu Mincho","Noto Serif SC",serif;margin:0 0 6px}
.doc-head p{margin:0;color:var(--muted);font-size:12.5px}
.body h1,.body h2,.body h3,.body h4{font-family:"Yu Mincho","Noto Serif SC",serif;line-height:1.55;margin:1.7em 0 .6em}
.body h1{font-size:25px}.body h2{font-size:21px}.body h3{font-size:18px}.body h4{font-size:16px}
.body p{margin:0 0 1em}
.body ul,.body ol{margin:0 0 1em;padding-left:1.5em}
.body li{margin:.25em 0}
.body code{background:var(--code);border-radius:4px;padding:1px 5px;font-size:.9em}
.body pre{background:var(--code);border-radius:10px;padding:14px 16px;overflow:auto;line-height:1.6}
.body pre code{background:none;padding:0;font-size:13px}
.body blockquote{margin:0 0 1em;padding:.2em 0 .2em 16px;border-left:3px solid var(--accent);color:var(--soft)}
.table-wrap{overflow:auto;margin:0 0 1.2em}
.body table{border-collapse:collapse;width:100%;font-size:14px}
.body th,.body td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top;word-break:keep-all}
.body th{background:var(--hl);font-weight:600;white-space:nowrap}
.body hr{border:0;border-top:1px solid var(--line);margin:2em 0}
.empty{color:var(--muted)}
@media (max-width:820px){
  .layout{display:block}
  aside{width:auto;height:auto;position:static;border-right:0;border-bottom:1px solid var(--line)}
  .list{max-height:46vh}
  main{padding:24px 16px 60px}
}
</style>
</head>
<body>
<div class="layout">
  <aside>
    <div class="side-head">
      <h1>经验教训库</h1>
      <p id="count"></p>
      <div class="tools">
        <input id="q" type="search" placeholder="搜索标题或正文…">
        <button id="theme" type="button" title="切换深浅色">◐</button>
      </div>
    </div>
    <div class="list" id="list"></div>
  </aside>
  <main><div class="doc" id="doc"></div></main>
</div>
<script id="data" type="application/json">__DATA__</script>
<script>
(function () {
  var NOTES = JSON.parse(document.getElementById('data').textContent);
  var listEl = document.getElementById('list');
  var docEl = document.getElementById('doc');
  var qEl = document.getElementById('q');
  document.getElementById('count').textContent = NOTES.length + ' 篇 · 按时间倒序';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    s = s.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2">$1</a>');
    s = s.replace(/(^|[^*])\\*([^*\\n]+)\\*/g, '$1<em>$2</em>');
    return s;
  }
  function md(text) {
    var lines = text.split(/\\r?\\n/), out = [], i = 0;
    var para = [], list = null, quote = [], table = null;
    function flushPara() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function flushList() {
      if (!list) return;
      out.push('<' + list.tag + '>' + list.items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + list.tag + '>');
      list = null;
    }
    function flushQuote() { if (quote.length) { out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>'); quote = []; } }
    function flushTable() {
      if (!table) return;
      var rows = table.rows, html = '<table>';
      if (table.head) html += '<thead><tr>' + table.head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead>';
      html += '<tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      out.push('<div class="table-wrap">' + html + '</div>'); table = null;
    }
    function flushAll() { flushPara(); flushList(); flushQuote(); flushTable(); }

    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        flushAll();
        var buf = [], j = i + 1;
        while (j < lines.length && !/^```/.test(lines[j])) { buf.push(lines[j]); j++; }
        out.push('<pre><code>' + esc(buf.join('\\n')) + '</code></pre>');
        i = j + 1; continue;
      }
      if (!line.trim()) { flushAll(); i++; continue; }
      var h = /^(#{1,4})\\s+(.*)$/.exec(line);
      if (h) { flushAll(); out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue; }
      if (/^\\s*([-*_])\\1{2,}\\s*$/.test(line)) { flushAll(); out.push('<hr>'); i++; continue; }
      if (/^\\s*>/.test(line)) { flushPara(); flushList(); flushTable(); quote.push(line.replace(/^\\s*>\\s?/, '')); i++; continue; }
      var tbl = /^\\s*\\|(.+)\\|\\s*$/.exec(line);
      if (tbl) {
        flushPara(); flushList(); flushQuote();
        var cells = tbl[1].split('|').map(function (c) { return c.trim(); });
        if (!table) table = { head: null, rows: [] };
        if (/^:?-{2,}:?$/.test(cells[0] || '')) { table.head = table.rows.pop() || null; i++; continue; }
        table.rows.push(cells);
        i++; continue;
      }
      var ul = /^\\s*[-*+]\\s+(.*)$/.exec(line);
      var ol = /^\\s*\\d+[.)]\\s+(.*)$/.exec(line);
      if (ul || ol) {
        flushPara(); flushQuote(); flushTable();
        var tag = ul ? 'ul' : 'ol';
        if (!list || list.tag !== tag) { flushList(); list = { tag: tag, items: [] }; }
        list.items.push((ul || ol)[1]); i++; continue;
      }
      flushList(); flushQuote(); flushTable();
      para.push(line.trim()); i++;
    }
    flushAll();
    return out.join('\\n');
  }

  function render(note) {
    docEl.innerHTML = '<div class="doc-head"><h2>' + esc(note.title) + '</h2><p>' + esc(note.file) +
      ' · ' + esc(note.mtime) + (note.desc ? ' · ' + esc(note.desc) : '') + '</p></div>' +
      '<div class="body">' + md(note.body) + '</div>';
    Array.prototype.forEach.call(listEl.children, function (el) {
      el.classList.toggle('on', el.dataset.file === note.file);
    });
    location.hash = note.file;
    window.scrollTo(0, 0);
    docEl.parentElement.scrollTop = 0;
  }

  function paint(filter) {
    var f = (filter || '').trim().toLowerCase();
    listEl.innerHTML = '';
    var shown = 0;
    NOTES.forEach(function (n) {
      var hay = (n.title + ' ' + n.desc + ' ' + n.file + ' ' + n.body).toLowerCase();
      if (f && hay.indexOf(f) < 0) return;
      shown++;
      var a = document.createElement('a');
      a.className = 'item'; a.dataset.file = n.file; a.href = '#' + n.file;
      var b = document.createElement('b'); b.textContent = n.title;
      var s = document.createElement('span'); s.textContent = n.mtime + ' · ' + (n.desc || n.file);
      a.appendChild(b); a.appendChild(s);
      a.addEventListener('click', function (e) { e.preventDefault(); render(n); });
      listEl.appendChild(a);
    });
    if (!shown) { var p = document.createElement('p'); p.className = 'empty'; p.style.padding = '10px 12px'; p.textContent = '没有匹配的条目'; listEl.appendChild(p); }
  }

  qEl.addEventListener('input', function () { paint(qEl.value); });

  var KEY = 'learned-theme';
  function setTheme(dark) {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY, dark ? '1' : '0');
  }
  document.getElementById('theme').addEventListener('click', function () {
    setTheme(!document.documentElement.classList.contains('dark'));
  });
  setTheme(localStorage.getItem(KEY) === '1');

  paint('');
  var want = decodeURIComponent(location.hash.slice(1));
  var start = NOTES.filter(function (n) { return n.file === want; })[0] || NOTES[0];
  if (start) render(start);
})();
</script>
</body>
</html>
"""


def main() -> None:
    items = collect()
    data = json.dumps(
        [{k: v for k, v in it.items() if k != "order"} for it in items],
        ensure_ascii=False,
    ).replace("</", "<\\/")
    html_text = TEMPLATE.replace("__DATA__", data)
    out = HERE / "index.html"
    out.write_text(html_text, encoding="utf-8")
    print(f"built {out} · {len(items)} notes · {len(html_text) // 1024} KB")


if __name__ == "__main__":
    main()
