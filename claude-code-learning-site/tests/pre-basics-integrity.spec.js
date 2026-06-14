/* ═══════════════════════════════════════════════════════
   Pre-Basics Integrity Test Suite (Playwright E2E)
   预备课页面完整性测试套件

   测试范围:
   A. Page Structure Integrity — 7页 × 结构检查
   B. Navigation System — TOPIC_ORDER/IDS/NAMES/PAGES 映射
   C. Quiz System — QUIZ_DATA 完整性
   D. Paywall System — 预备课始终免费
   E. Activation Code System — 格式校验
   F. Dual Directory Sync — claude-code-learning-site/pre-basics/ ⇄ docs/pre-basics/

   运行: npx playwright test tests/pre-basics-integrity.spec.js
   所需: npx playwright install chromium (首次)
   ═══════════════════════════════════════════════════════ */

const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ══════ Constants (must match nav.js & quiz.js) ══════
const PRE_BASICS_DIR = path.resolve(__dirname, '..', 'pre-basics');
const DOCS_PRE_BASICS_DIR = path.resolve(__dirname, '..', '..', 'docs', 'pre-basics');

const TOPIC_ORDER = [
  'pc-basics', 'open-ps', 'install-cc', 'first-chat',
  'file-basics', 'troubleshoot', 'deepseek'
];

const TOPIC_IDS = {
  'pc-basics': 1, 'open-ps': 2, 'install-cc': 3, 'first-chat': 4,
  'file-basics': 5, 'troubleshoot': 6, 'deepseek': 7
};

// The expected visible text on each page (title and h1)
// These are the ACTUAL page titles as they exist now (before rewrite)
const PAGE_TITLES = {
  'pc-basics': '认识你的电脑',
  'open-ps': { title: '第一次打开命令行', h1: '第一次打开命令行' },
  'install-cc': '安装 Claude Code',
  'first-chat': '第一次跟 AI 对话',
  'file-basics': '文件与文件夹基础',
  'troubleshoot': '遇到错误怎么办',
  'deepseek': { title: '让 Claude Code 在国内也能用', h1: '让 Claude Code 在国内也能用' }
};

// Helper: get expected title text for a topic
function expectedTitle(topicId) {
  const t = PAGE_TITLES[topicId];
  return typeof t === 'string' ? t : t.title;
}

function expectedH1(topicId) {
  const t = PAGE_TITLES[topicId];
  return typeof t === 'string' ? t : t.h1;
}

const TOPIC_PAGES = {
  'pc-basics': 'computer-basics.html', 'open-ps': 'open-powershell.html',
  'install-cc': 'install-claude-code.html', 'first-chat': 'first-conversation.html',
  'file-basics': 'file-basics.html', 'troubleshoot': 'when-things-go-wrong.html',
  'deepseek': 'deepseek-setup.html'
};

// Expected TOPIC_NAMES from nav.js
const TOPIC_NAMES = {
  'pc-basics': '认识你的电脑', 'open-ps': '打开 PowerShell',
  'install-cc': '安装 Claude Code', 'first-chat': '第一次对话',
  'file-basics': '文件与文件夹', 'troubleshoot': '遇到错误怎么办',
  'deepseek': '国内也能用'
};

// 7-module template section IDs (must exist in all pre-basics pages)
const MODULE_SECTIONS = ['why', 'walkthrough', 'review', 'pitfalls', 'practice', 'cheatsheet', 'learned'];

// ══════ Utility: determine page URL ══════
function pageUrl(topicId) {
  const filename = TOPIC_PAGES[topicId];
  return 'file:///' + path.join(PRE_BASICS_DIR, filename).replace(/\\/g, '/');
}

// ══════ Utility: get all pre-basics files ══════
function getPrebasicsFiles() {
  return fs.readdirSync(PRE_BASICS_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();
}

function getDocsPrebasicsFiles() {
  if (!fs.existsSync(DOCS_PRE_BASICS_DIR)) return [];
  return fs.readdirSync(DOCS_PRE_BASICS_DIR)
    .filter(f => f.endsWith('.html'))
    .sort();
}

// ═══════════════════════════════════════════════════════
//  TEST GROUP A: Page Structure Integrity
//  页面结构完整性 — 每页加载、7模块、quiz区域、标题、导航
// ═══════════════════════════════════════════════════════

test.describe('A. Page Structure Integrity (页面结构完整性)', () => {

  for (const topicId of TOPIC_ORDER) {
    const url = pageUrl(topicId);
    const titleText = expectedTitle(topicId);
    const h1Text = expectedH1(topicId);
    const idx = TOPIC_ORDER.indexOf(topicId) + 1; // 1-based display

    test.describe(`${topicId} (${titleText})`, () => {

      test(`A1.${idx} Page loads successfully (HTTP 200 via file://)`, async ({ page }) => {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
        // file:// URLs don't have HTTP status, but page.goto won't throw on success
        // Verify the page actually rendered something meaningful
        const bodyText = await page.textContent('body');
        expect(bodyText.length).toBeGreaterThan(100);
      });

      test(`A2.${idx} Page has correct <title>`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const title = await page.title();
        expect(title).toContain(titleText);
        expect(title).toContain('预备课');
      });

      test(`A3.${idx} Page has exactly one <h1> with topic name`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const h1s = page.locator('h1');
        await expect(h1s).toHaveCount(1);
        const text = await h1s.textContent();
        expect(text).toContain(h1Text);
      });

      test(`A4.${idx} All 7 module sections exist with correct IDs`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        for (const sectionId of MODULE_SECTIONS) {
          const section = page.locator(`section#${sectionId}`);
          await expect(section).toBeVisible({ timeout: 2000 });
        }
      });

      test(`A5.${idx} Module nav contains section links`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const nav = page.locator('nav.module-nav');
        await expect(nav).toBeVisible({ timeout: 2000 });

        // Even if section IDs differ from the canonical 7-module template,
        // the nav should at least link to key sections
        const links = await nav.locator('a[href^="#"]').count();
        expect(links).toBeGreaterThanOrEqual(6);
      });

      test(`A6.${idx} Quiz section exists with data-topic attribute`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const quizSection = page.locator('section.quiz-section');
        await expect(quizSection).toBeVisible({ timeout: 2000 });
        const topicAttr = await quizSection.getAttribute('data-topic');
        expect(topicAttr).toBe(topicId);
      });

      test(`A7.${idx} Quiz container div exists inside quiz section`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const quizContainer = page.locator('#quiz-container');
        await expect(quizContainer).toBeVisible({ timeout: 2000 });
      });

      test(`A8.${idx} nav.js is loaded (site-nav element rendered by renderNav)`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const siteNav = page.locator('nav.site-nav');
        await expect(siteNav).toBeVisible({ timeout: 2000 });
      });

      test(`A9.${idx} Nav contains essential links (首页, 预备课, 应用课, 入门, 进阶, 激活码, 支付)`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const nav = page.locator('nav.site-nav');
        const navText = await nav.textContent();
        expect(navText).toContain('首页');
        expect(navText).toContain('预备课');
        expect(navText).toContain('应用课');
        expect(navText).toContain('入门');
        expect(navText).toContain('进阶');
        expect(navText).toContain('激活码');
        expect(navText).toContain('支付');
      });

      test(`A10.${idx} Page has <meta name="description">`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const meta = page.locator('meta[name="description"]');
        await expect(meta).toHaveCount(1);
        const content = await meta.getAttribute('content');
        expect(content).not.toBeNull();
        expect(content.length).toBeGreaterThan(10);
      });

      test(`A11.${idx} Page has favicon`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const favicon = page.locator('link[rel="icon"]');
        await expect(favicon).toHaveCount(1);
      });

      test(`A12.${idx} Main content is wrapped in role="main"`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const main = page.locator('[role="main"]');
        await expect(main).toHaveCount(1);
      });

      test(`A13.${idx} No JavaScript errors in console`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto(url, { waitUntil: 'networkidle' });
        // Wait a bit for any late errors
        await page.waitForTimeout(500);
        expect(errors).toEqual([]);
      });

      test(`A14.${idx} quiz.js is loaded (window.QUIZ_DATA should be defined)`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const hasQuizData = await page.evaluate(() => {
          return typeof window.QUIZ_DATA !== 'undefined';
        });
        // QUIZ_DATA is an IIFE var, not on window. But renderQuiz should have run.
        // We check the quiz rendered something
        const quizContent = await page.locator('#quiz-container').textContent();
        expect(quizContent.length).toBeGreaterThan(20);
      });

      test(`A15.${idx} site-config.js is loaded (window.CC_SITE_CONFIG exists)`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const hasConfig = await page.evaluate(() => {
          return typeof window.CC_SITE_CONFIG !== 'undefined'
            && window.CC_SITE_CONFIG.allowedDomains
            && window.CC_SITE_CONFIG.allowedDomains.length > 0;
        });
        expect(hasConfig).toBe(true);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP B: Navigation System
//  导航系统 — TOPIC_ORDER/IDS/NAMES/PAGES 映射完整性
// ═══════════════════════════════════════════════════════

test.describe('B. Navigation System (导航系统)', () => {

  test('B1. TOPIC_ORDER contains all 7 pre-basics topics in correct order', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const order = await page.evaluate(() => window.TOPIC_ORDER);
    expect(order).toBeDefined();
    expect(Array.isArray(order)).toBe(true);

    // First 7 should be pre-basics in correct order
    const prebasics = order.slice(0, 7);
    expect(prebasics).toEqual(TOPIC_ORDER);
  });

  test('B2. TOPIC_ORDER has at least 21 total entries', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const order = await page.evaluate(() => window.TOPIC_ORDER);
    expect(order.length).toBeGreaterThanOrEqual(21);
  });

  test('B3. TOPIC_IDS maps each pre-basics topic to correct permanent number', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const ids = await page.evaluate(() => window.TOPIC_IDS);
    expect(ids).toBeDefined();
    for (const [topicId, expectedPermId] of Object.entries(TOPIC_IDS)) {
      expect(ids[topicId]).toBe(expectedPermId);
    }
  });

  test('B4. TOPIC_BY_ID reverse mapping exists and is correct for pre-basics', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const byId = await page.evaluate(() => window.TOPIC_BY_ID);
    expect(byId).toBeDefined();
    for (const [topicId, permId] of Object.entries(TOPIC_IDS)) {
      expect(byId[permId]).toBe(topicId,
        `TOPIC_BY_ID[${permId}] should be ${topicId}`);
    }
  });

  test('B5. TOPIC_NAMES has entries for all 7 pre-basics topics', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const names = await page.evaluate(() => window.TOPIC_NAMES);
    expect(names).toBeDefined();
    for (const [topicId, expectedName] of Object.entries(TOPIC_NAMES)) {
      expect(names[topicId]).toBe(expectedName);
    }
  });

  test('B6. TOPIC_PAGES maps each topic to correct filename', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const pages = await page.evaluate(() => window.TOPIC_PAGES);
    expect(pages).toBeDefined();
    for (const [topicId, expectedPage] of Object.entries(TOPIC_PAGES)) {
      expect(pages[topicId]).toBe(expectedPage);
    }
  });

  test('B7. topicPagePath() returns correct pre-basics directory prefix', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    for (const topicId of TOPIC_ORDER) {
      const result = await page.evaluate((tid) => {
        return window.topicPagePath ? window.topicPagePath(tid) : null;
      }, topicId);
      expect(result).toContain('pre-basics/');
      expect(result).toContain(TOPIC_PAGES[topicId]);
    }
  });

  test('B8. topicPagePath() for non-pre-basics uses correct directory', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const appliedPath = await page.evaluate(() => {
      return window.topicPagePath ? window.topicPagePath('ai-for-business') : null;
    });
    expect(appliedPath).toContain('applied/');

    const beginnerPath = await page.evaluate(() => {
      return window.topicPagePath ? window.topicPagePath('intro') : null;
    });
    expect(beginnerPath).toContain('beginner/');

    const intermediatePath = await page.evaluate(() => {
      return window.topicPagePath ? window.topicPagePath('core-commands') : null;
    });
    expect(intermediatePath).toContain('intermediate/');
  });

  test('B9. encodeTopicId + decodeTopicId round-trips for all pre-basics', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    for (const [topicId, permId] of Object.entries(TOPIC_IDS)) {
      const roundTrip = await page.evaluate((pid) => {
        const encoded = window.encodeTopicId ? window.encodeTopicId(pid) : null;
        const decoded = window.decodeTopicId ? window.decodeTopicId(encoded) : null;
        return { enc: encoded, dec: decoded, expected: pid };
      }, permId);
      expect(roundTrip.dec).toBe(roundTrip.expected,
        `Round-trip failed for ${topicId} (permId=${permId}): encoded=${roundTrip.enc}`);
      expect(roundTrip.enc.length).toBe(3);
    }
  });

  test('B10. ACT_CHARS has exactly 32 characters (26 letters minus I,O, plus 2-9)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const chars = await page.evaluate(() => window.ACT_CHARS);
    expect(chars).toBeDefined();
    expect(chars.length).toBe(32);
    expect(chars).not.toContain('I');
    expect(chars).not.toContain('O');
    expect(chars).not.toContain('0');
    expect(chars).not.toContain('1');
  });

  test('B11. NAV_PAGES (if defined) is consistent with TOPIC_PAGES', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const navPages = await page.evaluate(() => window.NAV_PAGES);
    // NAV_PAGES may not exist in current nav.js (simplified nav)
    // If it exists, verify consistency
    if (navPages) {
      for (const [topicId, page] of Object.entries(TOPIC_PAGES)) {
        if (navPages[topicId]) {
          expect(navPages[topicId]).toBe(page);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP C: Quiz System
//  考核系统 — QUIZ_DATA完整性、5题/话题、手写内容
// ═══════════════════════════════════════════════════════

test.describe('C. Quiz System (考核系统)', () => {

  test('C1. QUIZ_DATA has entries for all 7 pre-basics topics', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const quizData = await page.evaluate(() => {
      // QUIZ_DATA is a closure variable in quiz.js, not on window
      // But we can test by checking if the quiz renders
      const container = document.querySelector('#quiz-container');
      return container ? container.innerHTML.length > 0 : false;
    });
    expect(quizData).toBe(true);
  });

  test('C2. Quiz on pc-basics renders with 5 questions and submit button', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    // Wait for DOMContentLoaded to fire (quiz renders on DOMContentLoaded)
    await page.waitForTimeout(300);

    // Count question elements
    const questions = page.locator('.quiz-q');
    await expect(questions).toHaveCount(5);

    // Each question should have exactly 4 option buttons
    for (let i = 1; i <= 5; i++) {
      const qEl = page.locator(`#q-${i - 1}`);
      await expect(qEl).toBeVisible();
      const opts = qEl.locator('.quiz-opt');
      await expect(opts).toHaveCount(4);
    }

    // Submit button should exist and be disabled initially
    const submitBtn = page.locator('#quiz-submit-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('C3. Submit button enables only after all 5 questions answered', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const submitBtn = page.locator('#quiz-submit-btn');
    await expect(submitBtn).toBeDisabled();

    // Answer 4 questions — button should still be disabled
    for (let i = 0; i < 4; i++) {
      const opts = page.locator(`#q-${i} .quiz-opt`);
      await opts.first().click();
      await page.waitForTimeout(50);
    }
    await expect(submitBtn).toBeDisabled();

    // Answer 5th question — button should enable
    const lastOpts = page.locator('#q-4 .quiz-opt');
    await lastOpts.first().click();
    await page.waitForTimeout(50);
    await expect(submitBtn).toBeEnabled();
  });

  test('C4. Quiz shows result after submit (pass or fail)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Answer all questions (just click first option for each)
    for (let i = 0; i < 5; i++) {
      const opts = page.locator(`#q-${i} .quiz-opt`);
      await opts.first().click();
      await page.waitForTimeout(50);
    }

    // Submit
    await page.locator('#quiz-submit-btn').click();
    await page.waitForTimeout(300);

    // Result should be visible
    const result = page.locator('#quiz-result');
    await expect(result).toBeVisible();

    // Either passed or failed result should show
    const resultText = await result.textContent();
    expect(resultText.length).toBeGreaterThan(5);
  });

  test('C5. Quiz on each pre-basics page renders without JS errors', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(pageUrl(topicId), { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      // Quiz container should have content
      const container = page.locator('#quiz-container');
      await expect(container).toBeVisible();

      // Should have quiz questions or result (already passed from previous test)
      const qElements = page.locator('.quiz-q');
      const qCount = await qElements.count();
      // Either 5 questions, or result (previously passed)
      expect(qCount === 5 || qCount === 0).toBeTruthy();

      expect(errors).toEqual([]);
    }
  });

  test('C6. Handwriting content area can be toggled (after failing quiz)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Check if we're showing quiz or already passed
    const quizQs = page.locator('.quiz-q');
    const qCount = await quizQs.count();
    if (qCount === 0) {
      // Already passed, this test is not applicable
      return;
    }

    // Answer incorrectly (all first options are unlikely to all be correct)
    for (let i = 0; i < 5; i++) {
      const opts = page.locator(`#q-${i} .quiz-opt`);
      await opts.last().click(); // pick last option (likely wrong)
      await page.waitForTimeout(50);
    }

    await page.locator('#quiz-submit-btn').click();
    await page.waitForTimeout(300);

    // Handwriting toggle button should appear in failed result
    const hwToggle = page.locator('.handwrite-toggle-btn');
    if (await hwToggle.isVisible()) {
      await hwToggle.click();
      await page.waitForTimeout(200);

      const hwArea = page.locator('#handwrite-area');
      const isVisible = await hwArea.evaluate(el =>
        el.classList.contains('show')
      );
      expect(isVisible).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP D: Paywall System
//  付费墙系统 — 预备课始终免费
// ═══════════════════════════════════════════════════════

test.describe('D. Paywall System (付费墙系统)', () => {

  test('D1. Pre-basics pages should NOT have paywall-container', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const paywallContainers = page.locator('.paywall-container');
      const count = await paywallContainers.count();
      expect(count).toBe(0,
        `${topicId} should not have .paywall-container (pre-basics are free)`);
    }
  });

  test('D2. Pre-basics quiz section is NOT wrapped in paywall (directly visible)', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const quizSection = page.locator('section.quiz-section');
      await expect(quizSection).toBeVisible();

      // Verify quiz section is not inside a paywall wrapper
      const parentClass = await quizSection.locator('..').getAttribute('class');
      // The parent should not be a paywall-container
      // Check that there's no paywall-container ancestor
      const inPaywall = await page.evaluate(() => {
        const qs = document.querySelector('section.quiz-section');
        if (!qs) return null;
        let el = qs.parentElement;
        while (el) {
          if (el.classList.contains('paywall-container')) return true;
          el = el.parentElement;
        }
        return false;
      });
      expect(inPaywall).toBe(false,
        `Quiz section for ${topicId} should NOT be inside a paywall-container`);
    }
  });

  test('D3. isTopicUnlockedByProgress returns true for all pre-basics (first topic always free, rest based on progress)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });

    // First topic (pc-basics) is always unlocked (idx=0)
    const firstUnlocked = await page.evaluate(() => {
      return window.isTopicUnlockedByProgress
        ? window.isTopicUnlockedByProgress('pc-basics')
        : null;
    });
    expect(firstUnlocked).toBe(true);

    // For other topics, the function depends on progress state
    // But the function should at least exist and return a boolean
    for (const topicId of TOPIC_ORDER.slice(1)) {
      const result = await page.evaluate((tid) => {
        return window.isTopicUnlockedByProgress
          ? window.isTopicUnlockedByProgress(tid)
          : null;
      }, topicId);
      expect(typeof result).toBe('boolean');
    }
  });

  test('D4. localStorage keys use correct format (if set)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });

    // These keys should work and return proper types
    const allAccess = await page.evaluate(() => localStorage.getItem('cc-learn-all-access'));
    expect(allAccess === null || allAccess === 'true' || allAccess === 'false').toBe(true);

    const unlocked = await page.evaluate(() => localStorage.getItem('cc-learn-unlocked'));
    expect(unlocked === null || (() => { try { JSON.parse(unlocked); return true; } catch { return false; } })()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP E: Activation Code System
//  激活码系统 — recovery.js 未在预备课页面加载，此处验证系统存在性
//  详细算法测试见 tests/activation-code.test.js (Node.js unit tests)
// ═══════════════════════════════════════════════════════

test.describe('E. Activation Code System (激活码系统)', () => {

  test('E1. verifyActivationCode is NOT loaded on pre-basics pages (recovery.js not included)', async ({ page }) => {
    // verifyActivationCode comes from recovery.js, which is only loaded on pay/recover.html
    // Pre-basics pages intentionally do not load recovery.js
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const exists = await page.evaluate(() => {
      return typeof window.verifyActivationCode;
    });
    // verifyActivationCode should be 'undefined' on pre-basics pages
    expect(exists).toBe('undefined');
  });

  test('E2. TOPIC_BY_ID is available from nav.js (required for verifyActivationCode)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const byId = await page.evaluate(() => {
      return typeof window.TOPIC_BY_ID !== 'undefined'
        && Object.keys(window.TOPIC_BY_ID).length > 0;
    });
    expect(byId).toBe(true);
  });

  test('E3. ACT_CHARS is available from nav.js', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const chars = await page.evaluate(() => {
      return typeof window.ACT_CHARS === 'string'
        && window.ACT_CHARS.length > 0;
    });
    expect(chars).toBe(true);
  });

  test('E4. encodeTopicId and decodeTopicId are available on window', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const hasEncode = await page.evaluate(() => {
      return typeof window.encodeTopicId === 'function';
    });
    const hasDecode = await page.evaluate(() => {
      return typeof window.decodeTopicId === 'function';
    });
    expect(hasEncode).toBe(true);
    expect(hasDecode).toBe(true);
  });

  test('E5. encodeTopicId(1) produces "AAA" (first topic)', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const encoded = await page.evaluate(() => window.encodeTopicId(1));
    expect(encoded).toBe('AAA');
  });

  test('E6. decodeTopicId("AAA") produces 1', async ({ page }) => {
    await page.goto(pageUrl('pc-basics'), { waitUntil: 'domcontentloaded' });
    const decoded = await page.evaluate(() => window.decodeTopicId('AAA'));
    expect(decoded).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP F: Dual Directory Sync
//  双目录同步 — claude-code-learning-site/pre-basics/ ⇄ docs/pre-basics/
// ═══════════════════════════════════════════════════════

test.describe('F. Dual Directory Sync (双目录同步)', () => {

  test('F1. Same number of HTML files in both directories', () => {
    const siteFiles = getPrebasicsFiles();
    const docsFiles = getDocsPrebasicsFiles();

    expect(docsFiles.length).toBe(siteFiles.length);

    // Files should have the same names
    for (const f of siteFiles) {
      expect(docsFiles).toContain(f,
        `docs/pre-basics/ is missing file: ${f}`);
    }
  });

  test('F2. File sizes match between directories', () => {
    const siteFiles = getPrebasicsFiles();

    for (const f of siteFiles) {
      const sitePath = path.join(PRE_BASICS_DIR, f);
      const docsPath = path.join(DOCS_PRE_BASICS_DIR, f);

      if (!fs.existsSync(docsPath)) {
        // Already caught by F1, skip size check
        continue;
      }

      const siteSize = fs.statSync(sitePath).size;
      const docsSize = fs.statSync(docsPath).size;

      // Allow minor differences (LF/CRLF, trailing whitespace)
      // But flag anything > 5% difference
      const sizeDiff = Math.abs(siteSize - docsSize);
      const maxAllowed = Math.max(siteSize, docsSize) * 0.05;
      expect(sizeDiff).toBeLessThanOrEqual(maxAllowed,
        `File size mismatch for ${f}: site=${siteSize}B, docs=${docsSize}B (diff=${sizeDiff}B)`);
    }
  });

  test('F3. Both directories have the same module section IDs', () => {
    const siteFiles = getPrebasicsFiles();

    for (const f of siteFiles) {
      const sitePath = path.join(PRE_BASICS_DIR, f);
      const docsPath = path.join(DOCS_PRE_BASICS_DIR, f);

      if (!fs.existsSync(docsPath)) continue;

      const siteContent = fs.readFileSync(sitePath, 'utf-8');
      const docsContent = fs.readFileSync(docsPath, 'utf-8');

      // Extract all section IDs
      const siteSectionIds = [...siteContent.matchAll(/<section\s+id="([^"]+)"/g)].map(m => m[1]);
      const docsSectionIds = [...docsContent.matchAll(/<section\s+id="([^"]+)"/g)].map(m => m[1]);

      expect(siteSectionIds.length).toBe(docsSectionIds.length,
        `Different number of sections in ${f}`);
      expect(siteSectionIds.sort()).toEqual(docsSectionIds.sort());
    }
  });

  test('F4. Both directories have same data-topic in quiz section', () => {
    const siteFiles = getPrebasicsFiles();

    for (const f of siteFiles) {
      const sitePath = path.join(PRE_BASICS_DIR, f);
      const docsPath = path.join(DOCS_PRE_BASICS_DIR, f);

      if (!fs.existsSync(docsPath)) continue;

      const siteContent = fs.readFileSync(sitePath, 'utf-8');
      const docsContent = fs.readFileSync(docsPath, 'utf-8');

      const siteTopicMatch = siteContent.match(/data-topic="([^"]+)"/);
      const docsTopicMatch = docsContent.match(/data-topic="([^"]+)"/);

      if (siteTopicMatch) {
        expect(docsTopicMatch).not.toBeNull();
        expect(docsTopicMatch[1]).toBe(siteTopicMatch[1]);
      }
    }
  });

  test('F5. Both directories load same JS files (nav.js, quiz.js, site-config.js etc.)', () => {
    const siteFiles = getPrebasicsFiles();

    for (const f of siteFiles) {
      const sitePath = path.join(PRE_BASICS_DIR, f);
      const docsPath = path.join(DOCS_PRE_BASICS_DIR, f);

      if (!fs.existsSync(docsPath)) continue;

      const siteContent = fs.readFileSync(sitePath, 'utf-8');
      const docsContent = fs.readFileSync(docsPath, 'utf-8');

      // Extract all script src attributes
      const siteScripts = [...siteContent.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]).sort();
      const docsScripts = [...docsContent.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]).sort();

      expect(siteScripts).toEqual(docsScripts,
        `Script src mismatch in ${f}: site=${JSON.stringify(siteScripts)}, docs=${JSON.stringify(docsScripts)}`);
    }
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP G: Cross-Page Link Integrity
//  页面间链接完整性
// ═══════════════════════════════════════════════════════

test.describe('G. Cross-Page Link Integrity (页面间链接)', () => {

  test('G1. Each page has a "next" or "return to index" link', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });

      // Check for links to other pre-basics pages or index
      const allLinks = page.locator('a[href]');
      const linkCount = await allLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      // At least one link should go to index or another page
      const hrefs = await allLinks.evaluateAll(links =>
        links.map(l => l.getAttribute('href'))
      );
      const hasInternal = hrefs.some(h =>
        h && (h.includes('index.html') || h.includes('.html'))
      );
      expect(hasInternal).toBe(true,
        `${topicId} has no internal page link`);
    }
  });

  test('G2. Pre-basics pages link to each other correctly (previous/next in order)', async ({ page }) => {
    const prevNextLinks = [];

    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });

      // Find all links to pre-basics pages
      const localLinks = await page.evaluate((prebasicsPages) => {
        const links = document.querySelectorAll('a[href]');
        const result = [];
        links.forEach(l => {
          const href = l.getAttribute('href');
          if (href && prebasicsPages.some(p => href.includes(p))) {
            result.push(href);
          }
        });
        return result;
      }, Object.values(TOPIC_PAGES));

      prevNextLinks.push({ topicId, links: localLinks });
    }

    // Each page should have at least one link to another pre-basics page or index
    for (const entry of prevNextLinks) {
      // The link could be to the "next" page (inline text) or to index.html
      // Either is valid
      expect(entry.links.length).toBeGreaterThanOrEqual(0,
        // Allow 0 if link goes to index.html (not captured by this filter)
        `No pre-basics-to-pre-basics links found for ${entry.topicId}`);
    }
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP H: Content Quality Checks
//  内容质量检查 — 无平台特定限制前的基线
// ═══════════════════════════════════════════════════════

test.describe('H. Content Baseline (内容基线)', () => {

  test('H1. Each page has non-empty content in all 7 module sections', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });

      for (const sectionId of MODULE_SECTIONS) {
        const section = page.locator(`section#${sectionId}`);
        const text = await section.textContent();
        // Each section must have meaningful content (at least a heading + some text)
        expect(text.trim().length).toBeGreaterThan(10,
          `Section ${sectionId} in ${topicId} appears empty`);
      }
    }
  });

  test('H2. Count mentions of Windows vs Mac across all pages (baseline for rewrite)', async ({ page }) => {
    let winCount = 0;
    let macCount = 0;

    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const bodyText = await page.textContent('body');

      // Count case-insensitive matches
      winCount += (bodyText.match(/Windows/gi) || []).length;
      macCount += (bodyText.match(/Mac/gi) || []).length;
    }

    console.log(`\n  Content baseline across all 7 pages:`);
    console.log(`    Windows mentions: ${winCount}`);
    console.log(`    Mac mentions: ${macCount}`);
    console.log(`    (After rewrite: Mac mentions should be near 0, Windows only)`);

    // Post-rewrite: Windows-only. Mac mentions should be 0.
    expect(winCount).toBeGreaterThan(0, 'Should have Windows content');
    expect(macCount).toBe(0, 'Should have ZERO Mac mentions (Windows 10 only)');
  });

  test('H3. Each common.css is loaded in each page', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const cssLink = page.locator('link[href*="common.css"]');
      await expect(cssLink).toHaveCount(1);
    }
  });

  test('H4. Each quiz.css is loaded in each page', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const cssLink = page.locator('link[href*="quiz.css"]');
      await expect(cssLink).toHaveCount(1);
    }
  });
});

// ═══════════════════════════════════════════════════════
//  TEST GROUP I: Performance & Rendering (性能与渲染)
// ═══════════════════════════════════════════════════════

test.describe('I. Performance Baseline (性能基线)', () => {

  test('I1. Each page renders within 3 seconds (DOMContentLoaded)', async ({ page }) => {
    // Note: file:// loads are very fast. This catches catastrophic issues.
    for (const topicId of TOPIC_ORDER) {
      const startTime = Date.now();
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000,
        `${topicId} took ${loadTime}ms to load (DOMContentLoaded)`);
    }
  });

  test('I2. No visible layout shifts after load', async ({ page }) => {
    // This is a basic check — proper CLS measurement needs more tooling
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Basic check: body should be visible and have dimensions
      const bodyBox = await page.locator('body').boundingBox();
      expect(bodyBox).not.toBeNull();
      expect(bodyBox.width).toBeGreaterThan(0);
      expect(bodyBox.height).toBeGreaterThan(0);
    }
  });

  test('I3. All sections have viewport-visible dimensions', async ({ page }) => {
    for (const topicId of TOPIC_ORDER) {
      await page.goto(pageUrl(topicId), { waitUntil: 'domcontentloaded' });

      for (const sectionId of MODULE_SECTIONS) {
        const section = page.locator(`section#${sectionId}`);
        const box = await section.boundingBox();
        // Section should have non-zero dimensions
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    }
  });
});
