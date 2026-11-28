/* 本地书库：上传的 txt 只存在这台机器的 IndexedDB 里，不上传服务器 */
window.CNStore = (function () {
  var DB = 'jp-cn-books', STORE = 'books', VER = 1, dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open(DB, VER);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var s = db.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('owner', 'owner', { unique: false });
        }
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }

  function req(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode);
        var r = fn(t.objectStore(STORE));
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error); };
      });
    });
  }

  function owner() {
    try {
      var s = JSON.parse(localStorage.getItem('jp-ent') || 'null');
      return s && s.email ? String(s.email).toLowerCase() : '';
    } catch (e) { return ''; }
  }

  /* 段落切分：一行一段；行尾没有句末标点就接到下一行（兼容 PDF 转 txt 的硬折行） */
  var HEAD = /^(第[〇零一二三四五六七八九十百千0-9]+[章节回卷部篇集](?:[ 　]*[^\s　]{1,20})?|序章|序言|自序|小引|楔子|引子|后记|尾声|跋|番外.{0,16})$/;
  var END = /[。！？…”’」』）)~～—]$/;

  function parse(text) {
    text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    var lines = text.split('\n');
    var chapters = [], cur = { title: '正文', paras: [] }, buf = '';
    function flush() {
      var s = buf.replace(/\s+$/, '');
      if (s) cur.paras.push(s);
      buf = '';
    }
    function start(t) {
      flush();
      if (cur.paras.length) chapters.push(cur);
      cur = { title: t, paras: [] };
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(/　/g, ' ').replace(/^\s+|\s+$/g, '');
      if (!line) { flush(); continue; }
      if (HEAD.test(line)) { start(line); continue; }
      buf = buf ? buf + line : line;
      if (END.test(line)) flush();
    }
    flush();
    if (cur.paras.length) chapters.push(cur);
    if (chapters.length && !chapters[0].paras.length) chapters.shift();
    var chars = 0;
    chapters.forEach(function (c) {
      c.paras.forEach(function (p) { chars += p.length; });
    });
    return { chapters: chapters, chars: chars };
  }

  function save(file, title) {
    var who = owner();
    if (!who) return Promise.reject(new Error('请先登记'));
    return file.text().then(function (text) {
      var parsed = parse(text);
      if (!parsed.chars) throw new Error('这个文件里没有读到文字');
      var book = {
        id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        owner: who,
        title: title || file.name.replace(/\.txt$/i, ''),
        createdAt: Date.now(),
        chars: parsed.chars,
        chapters: parsed.chapters
      };
      return req('readwrite', function (s) { return s.add(book); }).then(function () { return book; });
    });
  }

  return {
    owner: owner,
    parse: parse,
    save: save,
    list: function (who) {
      return req('readonly', function (s) { return s.getAll(); }).then(function (all) {
        all = all || [];
        return who ? all.filter(function (b) { return b.owner === who; })
          : all;
      });
    },
    get: function (id) { return req('readonly', function (s) { return s.get(id); }); },
    del: function (id) { return req('readwrite', function (s) { return s.delete(id); }); }
  };
})();
