/* ═══════════════════════════════════════════════════════
   激活码系统 v3 — 永久编号格式 CC-SXXX-YYYY-ZZZZ（16字符）
   4-char计数器：每课92万容量，100万人够用
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CHARS = window.ACT_CHARS || 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var SECRET_SALT = 0xCC1E4;

  // 永久编号 → topicId（从 nav.js 读取，fallback 到空）
  var TOPIC_BY_ID = window.TOPIC_BY_ID || {};

  /* ── 3字符解码 字符串 → 编号 ── */
  function decodeId(code) {
    return CHARS.indexOf(code[0]) * 961
         + CHARS.indexOf(code[1]) * 31
         + CHARS.indexOf(code[2]) + 1;
  }

  /* ── 校验和 ── */
  function computeCheck(prefix) {
    var hash = SECRET_SALT;
    for (var i = 0; i < prefix.length; i++) {
      hash = ((hash << 5) - hash) + prefix.charCodeAt(i);
      hash = hash | 0;
    }
    var result = '';
    for (var j = 0; j < 4; j++) {
      result += CHARS[Math.abs((hash >> (j * 5)) % CHARS.length)];
    }
    return result;
  }

  /* ── Verify：CC-[SA][3-char-id][4-counter]-[4-check] ── */
  window.verifyActivationCode = function (code) {
    code = code.toUpperCase().trim();

    // 新格式 v3：CC-SXXX-YYY-ZZZZ（15字符）
    var parts = code.match(
      /^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9]{3})-([A-HJ-NP-Z2-9]{4})$/
    );
    if (!parts) {
      // 兼容旧格式 v2：CC-SBT-TJBZL（12字符）
      var oldParts = code.match(
        /^CC-([SAF])([A-HJ-NP-Z2-90])([A-HJ-NP-Z2-9]{2})-([A-HJ-NP-Z2-9]{4})$/
      );
      if (oldParts) {
        // 旧格式用位置解码，尝试匹配
        // 构建临时位置映射（与旧 TOPIC_ORDER 一致）
        var oldOrder = window.TOPIC_ORDER || [];
        var topicChar = oldParts[2];
        var idx = CHARS.indexOf(topicChar) - 1;
        var topicId = (idx >= 0 && idx < oldOrder.length) ? oldOrder[idx] : null;
        if (topicId) {
          var oldPrefix = 'CC-' + oldParts[1] + oldParts[2] + oldParts[3];
          if (computeCheck(oldPrefix) === oldParts[4]) {
            var oldType = oldParts[1] === 'A' ? 'all' : oldParts[1] === 'F' ? 'force' : 'single';
            return { type: oldType, topicId: oldType === 'all' ? null : topicId };
          }
        }
      }
      // 全都不匹配，查 localStorage 缓存
      var saved = JSON.parse(localStorage.getItem('cc-activation-codes') || '{}');
      if (saved[code]) return saved[code];
      return null;
    }

    // ── v3 格式验证 ──
    var typeChar = parts[1];
    var idCode   = parts[2];  // 3字符 永久编号
    var random   = parts[3];  // 4字符 计数器
    var check    = parts[4];  // 4字符 校验和

    var prefix = 'CC-' + typeChar + idCode + random;

    // 校验和不匹配
    if (computeCheck(prefix) !== check) return null;

    var type = typeChar === 'A' ? 'all' : 'single';

    // A 码（全站）不需要 topicId
    if (type === 'all') return { type: 'all', topicId: null };

    // S 码（单主题）：从永久编号查 topicId
    var tid = decodeId(idCode);
    var topicId = TOPIC_BY_ID[tid] || null;
    if (!topicId) return null; // 编号不存在

    return { type: 'single', topicId: topicId };
  };

  /* ── Apply：同 v2，不变 ── */
  window.applyActivationCode = function (result) {
    if (!result) return false;
    if (result.type === 'all') {
      localStorage.setItem('cc-learn-all-access', 'true');
    } else if (result.type === 'force' && result.topicId) {
      var quizState = JSON.parse(localStorage.getItem('cc-learn-quiz') || '{}');
      quizState[result.topicId] = { score: 0, total: 5, passed: true, date: new Date().toISOString(), forceUnlocked: true };
      localStorage.setItem('cc-learn-quiz', JSON.stringify(quizState));
      var topicsF = JSON.parse(localStorage.getItem('cc-learn-unlocked') || '[]');
      if (topicsF.indexOf(result.topicId) === -1) {
        topicsF.push(result.topicId);
        localStorage.setItem('cc-learn-unlocked', JSON.stringify(topicsF));
      }
    } else if (result.topicId) {
      var topics = JSON.parse(localStorage.getItem('cc-learn-unlocked') || '[]');
      if (topics.indexOf(result.topicId) === -1) {
        topics.push(result.topicId);
        localStorage.setItem('cc-learn-unlocked', JSON.stringify(topics));
      }
    }
    return true;
  };

  /* ── Device Fingerprint ── */
  function getFingerprint() {
    var data = [
      screen.width, screen.height, screen.colorDepth,
      navigator.language,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.platform || '',
      (navigator.userAgent || '').substring(0, 120)
    ].join('|');

    var hash = 0;
    for (var i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash | 0;
    }
    return Math.abs(hash).toString(36);
  }

  /* ── Cloud Verify：本地校验 + 服务端校验设备数 ── */
  window.verifyWithCloud = function (code, apiBase, callback) {
    // Step 1：本地校验
    var localResult = window.verifyActivationCode(code);
    if (!localResult) {
      callback({ ok: false, error: '激活码无效，请检查是否输入正确' });
      return;
    }

    // Step 2：服务端校验设备激活次数
    var fingerprint = getFingerprint();
    var url = (apiBase || '').replace(/\/+$/, '') + '/activate';

    try {
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
          // 服务端拒绝
          callback({
            ok: false,
            error: data.error || '激活失败',
            count: data.count,
            maxAllowed: data.maxAllowed
          });
        }
      })
      .catch(function (err) {
        // 网络错误 → 降级允许（不阻塞已付费用户）
        console.warn('[激活] 云端不可达，降级为本地校验:', err.message || err);
        window.applyActivationCode(localResult);
        callback({
          ok: true,
          type: localResult.type,
          topicId: localResult.topicId,
          remaining: '?',
          message: '云端暂不可达，已降级为本地解锁。下次联网时自动同步。'
        });
      });
    } catch (e) {
      // 同上
      console.warn('[激活] 云端请求异常，降级为本地校验:', e.message || e);
      window.applyActivationCode(localResult);
      callback({
        ok: true,
        type: localResult.type,
        topicId: localResult.topicId,
        remaining: '?',
        message: '云端暂不可达，已降级为本地解锁。'
      });
    }
  };
})();
