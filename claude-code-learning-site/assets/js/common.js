/* ═══════════════════════════════════════════════════════
   Claude Code 学习网站 — 公共脚本
   ═══════════════════════════════════════════════════════ */

// ── Copy to Clipboard ──
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.parentElement.textContent
        .replace(/复制$/, '')
        .replace(/已复制$/, '')
        .trim();
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1800);
      }).catch(() => {
        btn.textContent = '失败';
        setTimeout(() => { btn.textContent = '复制'; }, 1200);
      });
    });
  });
}

// ── Active Nav Link ──
function initNavHighlight() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === 'index.html' && (href === './' || href === 'index.html'))) {
      link.classList.add('active');
    }
  });
}

// ── Smooth Scroll for Module Nav ──
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update active module nav item
        const parent = link.closest('.module-nav');
        if (parent) {
          parent.querySelectorAll('a').forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  });
}

// ── Table of Contents Scroll Spy ──
function initScrollSpy() {
  const headings = document.querySelectorAll('section[id]');
  if (!headings.length) return;
  const navLinks = document.querySelectorAll('.module-nav a[href^="#"]');
  if (!navLinks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px' });

  headings.forEach(h => observer.observe(h));
}

// ── Search Filter (for pages with search) ──
function initSearch(inputSelector, cardSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll(cardSelector).forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  initNavHighlight();
  initSmoothScroll();
  initScrollSpy();
});
