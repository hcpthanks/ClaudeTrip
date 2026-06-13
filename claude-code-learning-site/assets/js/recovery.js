/* ═══════════════════════════════════════════════════════
   激活码系统 v4 — 永久编号格式 CC-SXXX-YYYY-ZZZZ（16字符）
   客户端仅做格式校验，有效性由 SCF 服务端判定
   移除 salt + checksum 客户端验证，防止离线伪造
   移除 v2 旧格式兼容（仅 v3 16字符）
   设备指纹改为 Canvas 稳定 hash
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // 永久编号 → topicId（从 nav.js 读取，fallback 到空）
  var TOPIC_BY_ID = window.TOPIC_BY_ID || {};

  /* ── 格式预检（仅正则，不做密码学验证）── */
  window.verifyActivationCode = function (code) {
    code = code.toUpperCase().trim();

    // v3 格式：CC-[SA][3-char][4-char]-[4-char]
    var parts = code.match(
      /^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9]{4})-([A-HJ-NP-Z2-9]{4})$/
    );
    if (!parts) return null;

    var typeChar = parts[1];
    var idCode   = parts[2];

    var type = typeChar === 'A' ? 'all' : 'single';

    // A 码（全站）不需要 topicId
    if (type === 'all') return { type: 'all', topicId: null };

    // S 码（单主题）：从永久编号查 topicId
    var decodeId = function(c) {
      var CHARS = window.ACT_CHARS || 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      return CHARS.indexOf(c[0]) * 961 + CHARS.indexOf(c[1]) * 31 + CHARS.indexOf(c[2]) + 1;
    };
    var tid = decodeId(idCode);
    var topicId = TOPIC_BY_ID[tid] || null;
    if (!topicId) return null;

    return { type: 'single', topicId: topicId };
  };

  /* ── Apply ── */
  window.applyActivationCode = function (result) {
    if (!result) return false;
    if (result.type === 'all') {
      localStorage.setItem('cc-learn-all-access', 'true');
    } else if (result.topicId) {
      var topics = JSON.parse(localStorage.getItem('cc-learn-unlocked') || '[]');
      if (topics.indexOf(result.topicId) === -1) {
        topics.push(result.topicId);
        localStorage.setItem('cc-learn-unlocked', JSON.stringify(topics));
      }
    }
    return true;
  };

  /* ── Device Fingerprint（Canvas 稳定 hash）── */
  function getFingerprint() {
    var chars = [];
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 50;
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('Claude Code Learning Site ♥ 学习站', 2, 17);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Claude Code Learning Site ♥ 学习站', 4, 19);
      var data = canvas.toDataURL();
      // 取 data URL 的后半段作为指纹输入
      chars.push(data.substring(data.length - 200));
    } catch (e) {
      chars.push('no-canvas');
    }
    // 补充不可变特征
    chars.push(navigator.language || '');
    chars.push(new Date().getTimezoneOffset().toString());
    chars.push((navigator.hardwareConcurrency || 0).toString());

    var str = chars.join('|');
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash | 0;
    }
    return Math.abs(hash).toString(36);
  }

  /* ── Cloud Verify：本地格式预检 + 服务端判定（fail-closed）── */
  window.verifyWithCloud = function (code, apiBase, callback) {
    // Step 1：本地格式预检
    var localResult = window.verifyActivationCode(code);
    if (!localResult) {
      callback({ ok: false, error: '激活码无效，请检查是否输入正确' });
      return;
    }

    // Step 2：服务端校验
    var fingerprint = getFingerprint();
    var url = (apiBase || '').replace(/\/+$/, '') + '/activate';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, fingerprint: fingerprint })
    })
    .then(function (resp) { return resp.json(); })
    .then(function (data) {
      if (data.ok) {
        // 服务端通过 → 本地解锁
        window.applyActivationCode(localResult);
        callback({
          ok: true,
          type: localResult.type,
          topicId: localResult.topicId,
          remaining: data.remaining,
          message: data.message
        });
      } else {
        // 服务端拒绝 → 不放行
        callback({
          ok: false,
          error: data.error || '激活失败',
          count: data.count,
          maxAllowed: data.maxAllowed
        });
      }
    })
    .catch(function (err) {
      // 网络错误 → fail-closed：不允许绕过服务端
      console.warn('[激活] 云端不可达:', err.message || err);
      callback({
        ok: false,
        error: '网络异常，无法验证激活码。请检查网络后重试。'
      });
    });
  };
})();
