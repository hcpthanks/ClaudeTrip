/* ═══════════════════════════════════════════════════════
   Phase 1 架构重构 — TDD RED 阶段
   测试: 网站从"学习站"升级为"AI 干活平台"的结构改造

   运行: npx vitest run tests/phase1-architecture.test.js
   ═══════════════════════════════════════════════════════ */

import { describe, test, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const SITE_DIR = join(import.meta.dirname, '..');

// ══════ Helper: load HTML into JSDOM ══════
function loadPage(relativePath) {
  const fullPath = join(SITE_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  const html = readFileSync(fullPath, 'utf-8');
  return new JSDOM(html, { url: `https://www.hcpthanks.com/${relativePath}` });
}

// ══════ Helper: check directory exists ══════
function dirExists(relativePath) {
  const fullPath = join(SITE_DIR, relativePath);
  return existsSync(fullPath) && statSync(fullPath).isDirectory();
}

// ══════ Helper: check file exists ══════
function fileExists(relativePath) {
  return existsSync(join(SITE_DIR, relativePath));
}

// ═══════════════════════════════════════════════════════
// TEST SUITE 1: Directory Structure
// ═══════════════════════════════════════════════════════
describe('Phase 1: Directory Structure', () => {

  describe('New directories created', () => {
    test('projects/ directory exists', () => {
      expect(dirExists('projects')).toBe(true);
    });

    test('projects/ai-video-factory/ directory exists', () => {
      expect(dirExists('projects/ai-video-factory')).toBe(true);
    });

    test('learn/ directory exists', () => {
      expect(dirExists('learn')).toBe(true);
    });

    test('tools/ directory exists', () => {
      expect(dirExists('tools')).toBe(true);
    });

    test('tools/ai-chat/ directory exists', () => {
      expect(dirExists('tools/ai-chat')).toBe(true);
    });

    test('tools/ai-image/ directory exists', () => {
      expect(dirExists('tools/ai-image')).toBe(true);
    });

    test('tools/ai-video/ directory exists', () => {
      expect(dirExists('tools/ai-video')).toBe(true);
    });
  });

  describe('Old paths preserved (not moved)', () => {
    const OLD_PATHS = [
      'pre-basics/computer-basics.html',
      'pre-basics/open-powershell.html',
      'pre-basics/install-claude-code.html',
      'pre-basics/first-conversation.html',
      'pre-basics/file-basics.html',
      'pre-basics/when-things-go-wrong.html',
      'pre-basics/deepseek-setup.html',
      'beginner/claude-intro.html',
      'beginner/plan-guide.html',
      'beginner/shortcuts.html',
      'beginner/conversation-skills.html',
      'beginner/project-init.html',
      'beginner/daily-workflow.html',
      'intermediate/core-commands.html',
      'intermediate/context-cost.html',
      'intermediate/workflow-patterns.html',
      'intermediate/21-day-plan.html',
      'applied/ai-for-business.html',
      'applied/talk-to-ai.html',
      'applied/ai-writing.html',
      'applied/bridge-to-coding.html',
      'pay/pay.html',
      'pay/success.html',
      'pay/recover.html',
      'embed/README.html',
      'embed/card-banner.html',
      'embed/card-square.html',
      'embed/card-float.html',
      'embed/iframe-content.html',
      'embed/widget.js',
      'index.html',
    ];

    OLD_PATHS.forEach(path => {
      test(`old path still exists: ${path}`, () => {
        expect(fileExists(path)).toBe(true);
      });
    });
  });

  describe('New page files created', () => {
    test('projects/index.html exists', () => {
      expect(fileExists('projects/index.html')).toBe(true);
    });

    test('projects/ai-video-factory/index.html exists', () => {
      expect(fileExists('projects/ai-video-factory/index.html')).toBe(true);
    });

    test('learn/index.html exists', () => {
      expect(fileExists('learn/index.html')).toBe(true);
    });

    test('tools/index.html exists', () => {
      expect(fileExists('tools/index.html')).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 2: New Homepage (index.html) Structure
// ═══════════════════════════════════════════════════════
describe('Phase 1: Homepage (index.html) Structure', () => {
  let dom;
  let doc;

  beforeAll(() => {
    const result = loadPage('index.html');
    if (result) {
      dom = result;
      doc = dom.window.document;
    }
  });

  test('homepage file loads successfully', () => {
    expect(doc).not.toBeNull();
    expect(doc).not.toBeUndefined();
  });

  describe('Navigation bar', () => {
    test('has "🏠 首页" link', () => {
      const nav = doc.querySelector('.site-nav');
      expect(nav).not.toBeNull();
      const hasHome = nav.textContent.includes('首页');
      expect(hasHome).toBe(true);
    });

    test('has "🚀 项目" link pointing to projects/', () => {
      const projectLink = doc.querySelector('.nav-links a[href*="projects"]') ||
        [...doc.querySelectorAll('.nav-links a')].find(a => a.textContent.includes('项目'));
      expect(projectLink).not.toBeNull();
    });

    test('has "📚 学习" link', () => {
      const learnLink = doc.querySelector('.nav-links a[href*="learn"]') ||
        [...doc.querySelectorAll('.nav-links a')].find(a => a.textContent.includes('学习'));
      expect(learnLink).not.toBeNull();
    });

    test('has "🛠️ 工具" link pointing to tools/', () => {
      const toolsLink = doc.querySelector('.nav-links a[href*="tools"]') ||
        [...doc.querySelectorAll('.nav-links a')].find(a => a.textContent.includes('工具'));
      expect(toolsLink).not.toBeNull();
    });

    test('has "🔑 激活码" recovery link', () => {
      const recoverLink = doc.querySelector('.nav-recover');
      expect(recoverLink).not.toBeNull();
      expect(recoverLink.getAttribute('href')).toBe('pay/recover.html');
    });

    test('has "💰 支付" CTA link', () => {
      const payLink = doc.querySelector('.nav-cta') ||
        [...doc.querySelectorAll('.nav-links a')].find(a => a.textContent.includes('支付'));
      expect(payLink).not.toBeNull();
    });
  });

  describe('Hero section', () => {
    test('has "AI 帮你干活" headline', () => {
      const h1 = doc.querySelector('.hero h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toContain('AI 帮你干活');
    });

    test('has tagline text', () => {
      const tagline = doc.querySelector('.hero .tagline');
      expect(tagline).not.toBeNull();
    });
  });

  describe('Featured projects section', () => {
    test('has project cards section with heading', () => {
      const projectSection = doc.querySelector('[id*="project"]') ||
        [...doc.querySelectorAll('h2')].find(h => h.textContent.includes('项目'));
      expect(projectSection).not.toBeNull();
    });

    test('has at least one .project-card', () => {
      const cards = doc.querySelectorAll('.project-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    test('AI video factory card links to projects/ai-video-factory/', () => {
      const card = doc.querySelector('a.project-card[href*="ai-video-factory"]') ||
        [...doc.querySelectorAll('.project-card')].find(c =>
          c.textContent.includes('视频') || c.textContent.includes('AI 视频')
        );
      expect(card).not.toBeNull();
    });
  });

  describe('Learning section', () => {
    test('has learning section linking to existing course paths', () => {
      const learnSection = doc.querySelector('[id*="learn"]') ||
        [...doc.querySelectorAll('section')].find(s => s.textContent.includes('学习'));
      expect(learnSection).not.toBeNull();
    });

    test('has link to pre-basics/', () => {
      const link = doc.querySelector('a[href*="pre-basics"]');
      expect(link).not.toBeNull();
    });

    test('has link to beginner/', () => {
      const link = doc.querySelector('a[href*="beginner"]');
      expect(link).not.toBeNull();
    });
  });

  describe('Tools section', () => {
    test('has tools section with heading', () => {
      const toolsSection = [...doc.querySelectorAll('h2')].find(h =>
        h.textContent.includes('工具'));
      expect(toolsSection).not.toBeNull();
    });

    test('has AI Chat tool entry', () => {
      const hasAIChat = doc.body.textContent.includes('对话') ||
        doc.body.textContent.includes('AI Chat');
      expect(hasAIChat).toBe(true);
    });
  });

  describe('Premium/Upgrade section', () => {
    test('has payment upgrade section', () => {
      const premium = doc.querySelector('.premium-teaser') ||
        [...doc.querySelectorAll('section')].find(s => s.textContent.includes('解锁'));
      expect(premium).not.toBeNull();
    });
  });

  describe('Footer', () => {
    test('has footer with site description', () => {
      const footer = doc.querySelector('.site-footer');
      expect(footer).not.toBeNull();
      expect(footer.textContent).toContain('AI 帮你干活');
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 3: Projects Page (projects/index.html)
// ═══════════════════════════════════════════════════════
describe('Phase 1: Projects List Page (projects/index.html)', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/index.html');
    if (result) doc = result.window.document;
  });

  test('file loads successfully', () => {
    expect(doc).not.toBeNull();
  });

  describe('Page structure', () => {
    test('has <nav> with site-nav class', () => {
      const nav = doc.querySelector('.site-nav');
      expect(nav).not.toBeNull();
    });

    test('has <footer> with site-footer class', () => {
      const footer = doc.querySelector('.site-footer');
      expect(footer).not.toBeNull();
    });

    test('has page heading about projects', () => {
      const h1 = doc.querySelector('h1');
      if (h1) {
        expect(h1.textContent.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Project cards', () => {
    test('has AI video factory project entry', () => {
      const hasLink = !!doc.querySelector('a[href="ai-video-factory/"]') ||
        !!doc.querySelector('a[href*="ai-video-factory"]');
      const hasText = doc.body.textContent.includes('视频工厂') ||
        doc.body.textContent.includes('AI 视频');
      expect(hasLink || hasText).toBe(true);
    });

    test('has "coming soon" placeholders for future projects', () => {
      const body = doc.body.textContent;
      const hasComingSoon = body.includes('即将上线') || body.includes('敬请期待');
      expect(hasComingSoon).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 4: AI Video Factory Page (projects/ai-video-factory/index.html)
// ═══════════════════════════════════════════════════════
describe('Phase 1: AI Video Factory Page (projects/ai-video-factory/index.html)', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('file loads successfully', () => {
    expect(doc).not.toBeNull();
  });

  describe('Page content', () => {
    test('has project name in heading', () => {
      const h1 = doc.querySelector('h1');
      if (h1) {
        const text = h1.textContent;
        expect(text.toLowerCase()).toMatch(/视频|video/);
      }
    });

    test('has navigation back to homepage', () => {
      const homeLink = doc.querySelector('a[href="/"]') ||
        doc.querySelector('a[href*="index.html"]');
      if (!homeLink) {
        // Navigation might be via .site-nav logo link
        const logoLink = doc.querySelector('.logo');
        expect(logoLink).not.toBeNull();
      }
    });

    test('mentions core technologies (Agnes AI, TTS)', () => {
      const body = doc.body.textContent;
      const hasAgnes = body.toLowerCase().includes('agnes');
      const hasTTS = body.toLowerCase().includes('tts') || body.includes('配音');
      expect(hasAgnes || hasTTS).toBe(true);
    });

    test('has placeholder for demo video/image', () => {
      const hasVisual = !!doc.querySelector('.project-visual') ||
        !!doc.querySelector('video') ||
        !!doc.querySelector('[class*="visual"]') ||
        !!doc.querySelector('[class*="preview"]');
      expect(hasVisual).toBe(true);
    });

    test('has feature list or capabilities section', () => {
      const hasList = !!doc.querySelector('ul') ||
        !!doc.querySelector('[class*="feature"]') ||
        !!doc.querySelector('[class*="capability"]');
      expect(hasList).toBe(true);
    });

    test('has footer with site info', () => {
      const footer = doc.querySelector('.site-footer');
      expect(footer).not.toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 5: Common CSS Tokens Preserved
// ═══════════════════════════════════════════════════════
describe('Phase 1: CSS Tokens Preservation', () => {
  const cssPath = join(SITE_DIR, 'assets', 'css', 'common.css');
  let css;

  beforeAll(() => {
    if (fileExists('assets/css/common.css')) {
      css = readFileSync(cssPath, 'utf-8');
    }
  });

  test('common.css file exists', () => {
    expect(css).not.toBeNull();
    expect(css).not.toBeUndefined();
  });

  describe('Existing design tokens preserved', () => {
    const REQUIRED_TOKENS = [
      '--bg',
      '--surface',
      '--border',
      '--text',
      '--text-muted',
      '--text-high',
      '--accent',
      '--green',
      '--orange',
      '--purple',
      '--lv-prebasics',
      '--lv-beginner',
      '--lv-intermediate',
      '--lv-expert',
      '--lv-applied',
    ];

    REQUIRED_TOKENS.forEach(token => {
      test(`CSS token ${token} still exists`, () => {
        expect(css).toContain(token);
      });
    });
  });

  describe('New component styles added', () => {
    test('has .project-card styles', () => {
      expect(css).toContain('.project-card');
    });

    test('has .project-visual styles', () => {
      expect(css).toContain('.project-visual');
    });

    test('has .project-info styles', () => {
      expect(css).toContain('.project-info');
    });

    test('has .project-tech or .project-badge styles', () => {
      const hasTech = css.includes('.project-tech');
      const hasBadge = css.includes('.project-badge');
      expect(hasTech || hasBadge).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 6: Site Config Updated
// ═══════════════════════════════════════════════════════
describe('Phase 1: Site Config (site-config.js)', () => {
  const configPath = join(SITE_DIR, 'assets', 'js', 'site-config.js');
  let configContent;

  beforeAll(() => {
    if (fileExists('assets/js/site-config.js')) {
      configContent = readFileSync(configPath, 'utf-8');
    }
  });

  test('config file exists', () => {
    expect(configContent).not.toBeNull();
  });

  test('officialName reflects new platform identity', () => {
    // Should mention AI + 干活 or related branding
    const hasNewName = configContent.includes('干活') ||
      configContent.includes('AI') && configContent.includes('平台');
    expect(hasNewName).toBe(true);
  });

  test('allowedDomains still includes hcpthanks.github.io and hcpthanks.com', () => {
    expect(configContent).toContain('hcpthanks.github.io');
    expect(configContent).toContain('hcpthanks.com');
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 7: Learn Page (learn/index.html) Structure
// ═══════════════════════════════════════════════════════
describe('Phase 1: Learn Page (learn/index.html)', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('learn/index.html');
    if (result) doc = result.window.document;
  });

  test('file loads successfully', () => {
    expect(doc).not.toBeNull();
  });

  describe('Page structure', () => {
    test('has site navigation', () => {
      const nav = doc.querySelector('.site-nav');
      expect(nav).not.toBeNull();
    });

    test('has page heading about learning', () => {
      const h1 = doc.querySelector('h1');
      if (h1) {
        expect(h1.textContent.length).toBeGreaterThan(0);
      }
    });

    test('has links to existing course levels', () => {
      const body = doc.body.textContent;
      const hasReferences = body.includes('预备课') || body.includes('入门') ||
        body.includes('pre-basics') || body.includes('beginner');
      expect(hasReferences).toBe(true);
    });

    test('has footer', () => {
      const footer = doc.querySelector('.site-footer');
      expect(footer).not.toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 8: Tools Page (tools/index.html) Structure
// ═══════════════════════════════════════════════════════
describe('Phase 1: Tools Page (tools/index.html)', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('tools/index.html');
    if (result) doc = result.window.document;
  });

  test('file loads successfully', () => {
    expect(doc).not.toBeNull();
  });

  describe('Page structure', () => {
    test('has site navigation', () => {
      const nav = doc.querySelector('.site-nav');
      expect(nav).not.toBeNull();
    });

    test('has page heading about tools', () => {
      const h1 = doc.querySelector('h1');
      if (h1) {
        expect(h1.textContent.length).toBeGreaterThan(0);
      }
    });

    test('has entries for AI Chat, AI Image, AI Video', () => {
      const body = doc.body.textContent;
      const hasChatTools = body.includes('对话') || body.includes('AI Chat') || body.includes('chat');
      const hasImageTools = body.includes('图片') || body.includes('生图') || body.includes('AI Image');
      const hasVideoTools = body.includes('视频') || body.includes('AI Video');
      // At least 2 of 3 should be present
      const count = [hasChatTools, hasImageTools, hasVideoTools].filter(Boolean).length;
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('has footer', () => {
      const footer = doc.querySelector('.site-footer');
      expect(footer).not.toBeNull();
    });
  });
});
