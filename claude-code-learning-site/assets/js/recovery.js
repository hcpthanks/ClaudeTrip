/* ═══════════════════════════════════════════════════════
   激活码系统 v3 — 永久编号格式 CC-SXXX-X-XXXX（13字符）
   31³=29791 主题容量，编号永不变，插入新课不影响已有激活码
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

  /* ── Verify：CC-[SA][3-char-id][1-random]-[4-check] ── */
  window.verifyActivationCode = function (code) {
    code = code.toUpperCase().trim();

    // 新格式 v3：CC-SAAA-A-AAAA（13字符）
    var parts = code.match(
      /^CC-([SA])([A-HJ-NP-Z2-9]{3})([A-HJ-NP-Z2-9])-([A-HJ-NP-Z2-9]{4})$/
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
    var random   = parts[3];  // 1字符 随机
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
})();
