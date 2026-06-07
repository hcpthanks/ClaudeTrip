/* ═══════════════════════════════════════════════════════
   付费墙逻辑 — localStorage 解锁状态管理
   ═══════════════════════════════════════════════════════ */

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

      // Inject recovery link
      var card = container.querySelector('.paywall-card');
      if (card && !card.querySelector('.paywall-recover-link')) {
        var link = document.createElement('p');
        link.className = 'paywall-recover-link';
        link.style.cssText = 'margin-top:14px;font-size:0.82em;';
        link.innerHTML = '<a href="../pay/recover.html" style="color:var(--text-muted);">🔑 已有激活码？点此恢复 →</a>';
        card.appendChild(link);
      }
    }
  });
}

// ── Check access params on page load ──
function checkAccessParams() {
  const params = new URLSearchParams(window.location.search);
  const unlocked = params.get('unlocked');
  const topic = params.get('topic');

  if (unlocked === 'all') {
    unlockAllAccess();
    window.history.replaceState({}, '', window.location.pathname);
    location.reload();
  } else if (unlocked === 'single' && topic) {
    unlockTopic(topic);
    window.history.replaceState({}, '', window.location.pathname);
    location.reload();
  }
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  checkAccessParams();
});
