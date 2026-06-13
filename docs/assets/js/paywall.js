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

// ── Device Fingerprint（与 recovery.js 同算法，SCF 端匹配用）──
function getDeviceFingerprint() {
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

// ── Cloud Verification：背景校验 localStorage 解锁是否真实 ──
function cloudVerify() {
  if (!hasAllAccess() && getUnlockedTopics().length === 0) return; // 没解锁，不用验

  var fp = getDeviceFingerprint();
  var scfUrl = (window.CC_SITE_CONFIG && window.CC_SITE_CONFIG.scfVerifyUrl)
    ? window.CC_SITE_CONFIG.scfVerifyUrl
    : 'https://1253632363-hkdthg8jb2.ap-beijing.tencentscf.com';
  var url = scfUrl.replace(/\/+$/, '') + '/check-access';

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint: fp }),
    signal: AbortSignal.timeout(5000)
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.hasAccess === false) {
        // 云端无记录 → 清除 localStorage 解锁 → 重新锁定
        console.log('[paywall] 云端校验未通过，锁定内容');
        localStorage.removeItem(LS_ALL_ACCESS);
        localStorage.removeItem(LS_UNLOCKED);
        location.reload();
      }
      // hasAccess === true → 确认解锁
      // hasAccess === 'unknown'（服务端异常）→ 不清除，但也不自动信任
    })
    .catch(function () {
      // 网络不通 → fail-closed：保留当前状态，不主动信任
      console.warn('[paywall] 云端校验不可达，保持当前锁定状态');
    });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', function () {
  // Auto-init paywall for any page with .paywall-container
  var container = document.querySelector('.paywall-container');
  if (container) {
    var topicId = container.dataset.topic;
    if (topicId) renderPaywall(topicId);
  }
  // 背景云端校验（已解锁用户验证是否有真实激活记录）
  cloudVerify();
});
