/* ═══════════════════════════════════════════════════════
   付费墙逻辑 — localStorage 解锁状态管理
   ═══════════════════════════════════════════════════════ */

/* ══════ 内联防盗锁 — anti-theft.js 被删后仍有支付保护 ══════ */
(function () {
  'use strict';
  // 如果 anti-theft.js 已正常加载，无需重复
  if (window.getPaymentUrl && window.showHijackWarning) return;

  var CFG = (window.CC_SITE_CONFIG && window.CC_SITE_CONFIG.allowedDomains)
    ? window.CC_SITE_CONFIG
    : {
        allowedDomains: ['hcpthanks.github.io', 'hcpthanks.com', 'www.hcpthanks.com', 'localhost', '127.0.0.1'],
        officialPayUrl: 'https://www.hcpthanks.com/pay/pay.html'
      };
  var DOMAINS = CFG.allowedDomains;
  var PAY_URL = CFG.officialPayUrl;
  var host = (window.location.hostname || '').toLowerCase();

  function isOfficial() {
    for (var i = 0; i < DOMAINS.length; i++) {
      if (host === DOMAINS[i] || host.endsWith('.' + DOMAINS[i])) return true;
    }
    return host === '';
  }

  // 支付 URL 劫持降级
  window.getPaymentUrl = window.getPaymentUrl || function (plan, topicId) {
    if (isOfficial()) {
      return '../pay/pay.html?plan=' + encodeURIComponent(plan) +
        (topicId ? '&topic=' + encodeURIComponent(topicId) : '');
    }
    var url = PAY_URL + '?plan=' + encodeURIComponent(plan);
    if (topicId) url += '&topic=' + encodeURIComponent(topicId);
    url += '&ref=' + encodeURIComponent(host) + '&hijacked=1';
    return url;
  };

  // 支付弹窗降级
  window.showHijackWarning = window.showHijackWarning || function (callback) {
    if (isOfficial()) { if (callback) callback(); return; }
    if (confirm('⚠️ 当前访问的网站（' + host + '）非官方站点。\n\n支付将直接付给原作者 hcpthanks.com。\n是否继续？') && callback) callback();
  };

  if (!isOfficial()) console.log('[paywall内联防护] anti-theft.js 缺失，已启用备用支付保护');
})();
/* ════════════════════════════════════════════════════════════ */

const LS_UNLOCKED = 'cc-learn-unlocked';
const LS_ALL_ACCESS = 'cc-learn-all-access';

// ── State ──
function hasAllAccess() {
  return localStorage.getItem(LS_ALL_ACCESS) === 'true';
}

function getUnlockedTopics() {
  try {
    return JSON.parse(localStorage.getItem(LS_UNLOCKED) || '[]');
  } catch {
    return [];
  }
}

function isTopicUnlocked(topicId) {
  if (hasAllAccess()) return true;
  return getUnlockedTopics().includes(topicId);
}

function unlockTopic(topicId) {
  if (hasAllAccess()) return;
  const topics = getUnlockedTopics();
  if (!topics.includes(topicId)) {
    topics.push(topicId);
    localStorage.setItem(LS_UNLOCKED, JSON.stringify(topics));
  }
}

function unlockAllAccess() {
  localStorage.setItem(LS_ALL_ACCESS, 'true');
}

// ── Render Paywall ──
function renderPaywall(topicId) {
  const containers = document.querySelectorAll('.paywall-container');
  if (!containers.length) return;

  const unlocked = isTopicUnlocked(topicId);

  containers.forEach(container => {
    if (unlocked) {
      // Reveal content
      container.classList.add('unlocked');
      const content = container.querySelector('.paywall-content');
      const fade = container.querySelector('.paywall-fade');
      const card = container.querySelector('.paywall-card');
      if (content) content.classList.add('unlocked');
      if (fade) fade.style.display = 'none';
      if (card) card.style.display = 'none';
    } else {
      // Keep locked — card and fade already in HTML
      const singleBtn = container.querySelector('.paywall-btn-single');
      const allBtn = container.querySelector('.paywall-btn-all');

      if (singleBtn) {
        singleBtn.addEventListener('click', () => {
          var url = window.getPaymentUrl
            ? window.getPaymentUrl('single', topicId)
            : '../pay/pay.html?plan=single&topic=' + encodeURIComponent(topicId);
          if (window.showHijackWarning) {
            window.showHijackWarning(function () { window.location.href = url; });
          } else {
            window.location.href = url;
          }
        });
      }

      if (allBtn) {
        allBtn.addEventListener('click', () => {
          var url = window.getPaymentUrl
            ? window.getPaymentUrl('all', topicId)
            : '../pay/pay.html?plan=all&from=' + encodeURIComponent(topicId);
          if (window.showHijackWarning) {
            window.showHijackWarning(function () { window.location.href = url; });
          } else {
            window.location.href = url;
          }
        });
      }

      // Inject recovery link — more prominent with separator
      var card = container.querySelector('.paywall-card');
      if (card && !card.querySelector('.paywall-recover-link')) {
        var sep = document.createElement('div');
        sep.style.cssText = 'margin:16px 0 12px;border-top:1px solid var(--border);';
        card.appendChild(sep);
        var link = document.createElement('div');
        link.className = 'paywall-recover-link';
        link.style.cssText = 'margin-top:0;';
        link.innerHTML = '<a href="../pay/recover.html" style="display:inline-block;padding:8px 18px;background:rgba(88,166,255,0.1);border:1px solid rgba(88,166,255,0.3);border-radius:6px;color:var(--accent);font-size:0.9em;font-weight:600;text-decoration:none;">🔑 已有激活码？点此恢复</a>';
        card.appendChild(link);
      }
    }
  });
}

// ── Device Fingerprint — delegates to nav.js shared Canvas fingerprint ──
function getLocalFingerprint() {
  return (window.getDeviceFingerprint && window.getDeviceFingerprint()) || 'fp-unknown';
}

// ── Cloud Verification：阻塞式校验 localStorage 解锁是否真实 ──
// 返回 Promise：{ hasAccess: true|false|'unknown' }
// 先验后渲，关闭时序漏洞
function cloudVerify() {
  if (!hasAllAccess() && getUnlockedTopics().length === 0) {
    // 没解锁，无需验证
    return Promise.resolve({ hasAccess: true });
  }

  var fp = getLocalFingerprint();
  var scfUrl = (window.CC_SITE_CONFIG && window.CC_SITE_CONFIG.scfVerifyUrl)
    ? window.CC_SITE_CONFIG.scfVerifyUrl
    : 'https://1253632363-hkdthg8jb2.ap-beijing.tencentscf.com';
  var url = scfUrl.replace(/\/+$/, '') + '/check-access';

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint: fp }),
    signal: AbortSignal.timeout(3000)
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.hasAccess === false) {
        // 云端无匹配 → 尝试用缓存激活码重新注册（过渡：指纹算法刚统一）
        var savedCodes = getSavedActivationCodes();
        if (savedCodes.length > 0) {
          return reRegisterFingerprint(savedCodes, fp).then(function (reRegOk) {
            if (reRegOk) return { hasAccess: true };
            // 重注册失败 → 清理
            cleanupAndReload();
            return { hasAccess: false };
          });
        }
        // 无缓存激活码 → 清理
        cleanupAndReload();
        return { hasAccess: false };
      }
      // hasAccess === true 或 hasAccess === 'unknown' → 保留当前状态
      return { hasAccess: true };
    })
    .catch(function () {
      // 网络不通 → fail-open：信任 localStorage，保护付费用户
      console.warn('[paywall] 云端校验不可达，信任本地解锁状态');
      return { hasAccess: true };
    });
}

// ── 辅助：从 localStorage 读取缓存的激活码 ──
function getSavedActivationCodes() {
  try {
    var saved = JSON.parse(localStorage.getItem('cc-activation-codes') || '{}');
    return Object.keys(saved);
  } catch (e) {
    return [];
  }
}

// ── 辅助：用缓存激活码重新向 SCF 注册新指纹（指纹算法迁移过渡）──
function reRegisterFingerprint(codes, fingerprint) {
  var scfUrl = (window.CC_SITE_CONFIG && window.CC_SITE_CONFIG.scfVerifyUrl)
    ? window.CC_SITE_CONFIG.scfVerifyUrl.replace(/\/+$/, '')
    : 'https://1253632363-hkdthg8jb2.ap-beijing.tencentscf.com';
  var url = scfUrl + '/activate';

  var attempts = codes.map(function (code) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, fingerprint: fingerprint }),
      signal: AbortSignal.timeout(3000)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { return data.ok === true; })
      .catch(function () { return false; });
  });

  return Promise.all(attempts).then(function (results) {
    return results.some(function (r) { return r === true; });
  });
}

// ── 辅助：清除解锁状态并重新锁定 ──
function cleanupAndReload() {
  localStorage.removeItem(LS_ALL_ACCESS);
  localStorage.removeItem(LS_UNLOCKED);
  location.reload();
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function () {
  // 先验后渲：先云端校验，再渲染付费墙
  cloudVerify().then(function () {
    var container = document.querySelector('.paywall-container');
    if (container) {
      var topicId = container.dataset.topic;
      if (topicId) renderPaywall(topicId);
    }
  });
});
