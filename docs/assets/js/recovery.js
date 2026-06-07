/* ═══════════════════════════════════════════════════════
   激活码系统 v2 — 短码格式 CC-XXXX-XXXX（10字符）
   换浏览器/换电脑后输入激活码即可恢复购买
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var SECRET_SALT = 0xCC1E4;

  // Topic → single-char index (0=all, 1-6=intro..workflow)
  var TOPIC_KEYS = window.TOPIC_ORDER;

  function topicToChar(topicId) {
    var idx = TOPIC_KEYS.indexOf(topicId);
    return idx >= 0 ? CHARS[idx + 1] : 'X';
  }

  function charToTopic(c) {
    var idx = CHARS.indexOf(c) - 1;
    return (idx >= 0 && idx < TOPIC_KEYS.length) ? TOPIC_KEYS[idx] : null;
  }

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

  /* ── Generate: CC-[S/A][topic][random×2]-[check×4] ── */
  window.generateActivationCode = function (type, topicId) {
    var typeChar = type === 'all' ? 'A' : type === 'force' ? 'F' : 'S';
    var topicChar = type === 'all' ? '0' : topicToChar(topicId);
    var random = CHARS[Math.floor(Math.random() * CHARS.length)]
               + CHARS[Math.floor(Math.random() * CHARS.length)];
    var prefix = 'CC-' + typeChar + topicChar + random;
    var check = computeCheck(prefix);
    var code = prefix + '-' + check;

    // Cache in localStorage for same-browser convenience
    var saved = JSON.parse(localStorage.getItem('cc-activation-codes') || '{}');
    saved[code] = { type: type, topicId: topicId, ts: Date.now() };
    localStorage.setItem('cc-activation-codes', JSON.stringify(saved));

    return code;
  };

  /* ── Verify ── */
  window.verifyActivationCode = function (code) {
    code = code.toUpperCase().trim();

    // Match: CC-[S/A][topic-char][2 random]-[4 check]
    var parts = code.match(
      /^CC-([SAF])([A-HJ-NP-Z2-90])([A-HJ-NP-Z2-9]{2})-([A-HJ-NP-Z2-9]{4})$/
    );
    if (!parts) {
      // Fallback: check localStorage cache
      var saved = JSON.parse(localStorage.getItem('cc-activation-codes') || '{}');
      if (saved[code]) return saved[code];
      return null;
    }

    var prefix = 'CC-' + parts[1] + parts[2] + parts[3];
    var check = computeCheck(prefix);
    if (check !== parts[4]) return null;

    var typeChar = parts[1];
    var type = typeChar === 'A' ? 'all' : typeChar === 'F' ? 'force' : 'single';
    var topicId = typeChar === 'A' ? null : charToTopic(parts[2]);

    return { type: type, topicId: topicId };
  };

  /* ── Apply ── */
  window.applyActivationCode = function (result) {
    if (!result) return false;
    if (result.type === 'all') {
      localStorage.setItem('cc-learn-all-access', 'true');
    } else if (result.type === 'force' && result.topicId) {
      // Force unlock: mark quiz passed + forceUnlocked（跳过冷却，解锁下一课）
      var quizState = JSON.parse(localStorage.getItem('cc-learn-quiz') || '{}');
      quizState[result.topicId] = { score: 0, total: 5, passed: true, date: new Date().toISOString(), forceUnlocked: true };
      localStorage.setItem('cc-learn-quiz', JSON.stringify(quizState));
      // Also unlock page content
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
