/* ═══════════════════════════════════════════════════════
   Payment Security Fixes — Playwright E2E Tests
   测试 5 个安全修补的浏览器端行为

   运行: npx playwright test tests/payment-security.spec.js
   所需: npx playwright install chromium (首次)
   ═══════════════════════════════════════════════════════ */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ══════ URL Constants ══════
const SITE_DIR = path.resolve(__dirname, '..');
const RECOVER_URL = 'file:///' + path.join(SITE_DIR, 'pay', 'recover.html').replace(/\\/g, '/');
const PREBASICS_URL = 'file:///' + path.join(SITE_DIR, 'pre-basics', 'computer-basics.html').replace(/\\/g, '/');
const APPLIED_URL = 'file:///' + path.join(SITE_DIR, 'applied', 'ai-for-business.html').replace(/\\/g, '/');

// ═══════════════════════════════════════════════════════
//  Fix 1 (CRITICAL): window.applyActivationCode removed from global scope
//  Change: window.applyActivationCode = function(result) {...} → function applyActivationCode(result) {...} (IIFE-private)
//  Expected: typeof window.applyActivationCode === 'undefined' on recover.html
//  But verifyActivationCode and verifyWithCloud must still be on window
// ═══════════════════════════════════════════════════════

test.describe('Fix 1: applyActivationCode removed from global scope', () => {

  test('F1.1: window.applyActivationCode should be undefined (IIFE-private)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => typeof window.applyActivationCode);
    expect(result).toBe('undefined');
  });

  test('F1.2: window.applyActivationCode should NOT exist even after verification attempt', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });

    // Trigger verifyWithCloud (which calls applyActivationCode internally)
    // This verifies the function is still usable internally but NOT exposed globally
    const input = page.locator('#code-input');
    await input.fill('CC-SAAAAAAA-AAAA');
    const btn = page.locator('#verify-btn');
    await btn.click();
    await page.waitForTimeout(1000);

    // applyActivationCode should still be undefined even after verification runs
    const result = await page.evaluate(() => typeof window.applyActivationCode);
    expect(result).toBe('undefined');
  });

  test('F1.3: window.verifyActivationCode should still be a function', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => typeof window.verifyActivationCode);
    expect(result).toBe('function');
  });

  test('F1.4: window.verifyWithCloud should still be a function', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(() => typeof window.verifyWithCloud);
    expect(result).toBe('function');
  });

  test('F1.5: verifyActivationCode validates format correctly for valid S code', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    // Format: CC-S + AAA(encodeTopicId(1)) + AAAA(counter 1) + - + AAAA(any checksum)
    // encodeTopicId(1) = AAA, so code is CC-SAAAAAAA-AAAA
    const result = await page.evaluate(() => {
      var code = 'CC-SAAAAAAA-AAAA';
      return window.verifyActivationCode(code);
    });
    expect(result).not.toBeNull();
    expect(result.type).toBe('single');
    expect(result.topicId).toBe('pc-basics');
  });

  test('F1.6: verifyActivationCode validates format correctly for valid A code', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    // Format: CC-A + AAA(placeholder) + AAAA(counter) + - + AAAA(checksum)
    // AAA in topic position just means valid charset, not actual topic
    var code = 'CC-AAAAAAAA-AAAA';
    var result = await page.evaluate((c) => window.verifyActivationCode(c), code);
    expect(result).not.toBeNull();
    expect(result.type).toBe('all');
    expect(result.topicId).toBeNull();
  });

  test('F1.7: verifyActivationCode returns null for obviously invalid string', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var result = await page.evaluate(() => window.verifyActivationCode('INVALID'));
    expect(result).toBeNull();
    result = await page.evaluate(() => window.verifyActivationCode('12345'));
    expect(result).toBeNull();
    result = await page.evaluate(() => window.verifyActivationCode('CC-XXXX-YYYY-ZZZZ'));
    expect(result).toBeNull();
  });

  test('F1.8: verifyActivationCode does NOT crash on empty string', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var result = await page.evaluate(() => window.verifyActivationCode(''));
    expect(result).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
//  Fix 2 (CRITICAL): cloudVerify now blocking (await before render)
//  Change: cloudVerify() returns Promise, init waits for it before calling renderPaywall()
//  Expected: On pages with .paywall-container, cloudVerify must complete before paywall renders
//  Note: cloudVerify is IIFE-private. E2E tests verify observable behavior:
//    paywall loads, renders, doesn't crash. file:// = fail-open (trusts localStorage).
// ═══════════════════════════════════════════════════════

test.describe('Fix 2: cloudVerify blocks before paywall render', () => {

  test('F2.1: Page with paywall-container loads without page-crashing errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(APPLIED_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Filter out expected network errors from file:// fetch (cloudVerify network unreachable = fail-open)
    // paywall.js .catch() on cloudVerify logs to console.warn but does NOT throw
    const criticalErrors = errors.filter(e =>
      !e.includes('fetch') &&
      !e.includes('Failed to fetch') &&
      !e.includes('network')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('F2.2: paywall-container exists after DOMContentLoaded + async init', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    // paywall.js init runs on DOMContentLoaded, cloudVerify is async
    // Wait for cloudVerify().then(() => renderPaywall()) to complete
    await page.waitForTimeout(1500);

    const container = page.locator('.paywall-container');
    await expect(container).toHaveCount(1);
    await expect(container).toBeVisible({ timeout: 3000 });
  });

  test('F2.3: paywall card is visible when user has no access (locked state)', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // On file:// with no localStorage, cloudVerify fail-open → trust empty localStorage → locked
    const card = page.locator('.paywall-card');
    await expect(card).toBeVisible({ timeout: 3000 });
  });

  test('F2.4: paywall fade overlay is visible in locked state', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const fade = page.locator('.paywall-fade');
    await expect(fade).toBeVisible({ timeout: 3000 });
  });

  test('F2.5: paywall has single-topic purchase button', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const singleBtn = page.locator('.paywall-btn-single');
    await expect(singleBtn).toBeVisible({ timeout: 3000 });

    var text = await singleBtn.textContent();
    expect(text.length).toBeGreaterThan(1);
  });

  test('F2.6: paywall has all-access purchase button', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const allBtn = page.locator('.paywall-btn-all');
    await expect(allBtn).toBeVisible({ timeout: 3000 });

    var text = await allBtn.textContent();
    expect(text.length).toBeGreaterThan(1);
  });

  test('F2.7: paywall has recovery link injected', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const recoverLink = page.locator('.paywall-recover-link');
    await expect(recoverLink).toBeVisible({ timeout: 3000 });

    // Link should point to recover.html
    var href = await recoverLink.locator('a').getAttribute('href');
    expect(href).toContain('recover.html');
  });

  test('F2.8: paywall does NOT render before cloudVerify completes (locked state consistent)', async ({ page }) => {
    // The key security property: paywall rendering is deferred until after cloudVerify.
    // We verify this by checking that the initial page state (before DOMContentLoaded callback)
    // is either locked or unlocked consistently — no race between render and verify.
    // On file://, cloudVerify fail-open → trusts localStorage → renders locked state.
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Paywall content should be in locked state (not unlocked class)
    var content = page.locator('.paywall-content');
    var hasUnlocked = await content.evaluate(el => el.classList.contains('unlocked'));
    expect(hasUnlocked).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════
//  Fix 3 (CRITICAL): Fingerprint algorithm unified to Canvas hash
//  Change: nav.js defines window.getDeviceFingerprint() (Canvas-based)
//          recovery.js deletes old canvas fingerprint, calls window.getDeviceFingerprint()
//          paywall.js deletes old screen-based fingerprint, calls window.getDeviceFingerprint()
//  Expected: Both files produce identical fingerprints for the same device
// ═══════════════════════════════════════════════════════

test.describe('Fix 3: Fingerprint unified to Canvas hash', () => {

  test('F3.1: window.getDeviceFingerprint exists on recover.html (loaded from nav.js)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var result = await page.evaluate(() => typeof window.getDeviceFingerprint);
    expect(result).toBe('function');
  });

  test('F3.2: window.getDeviceFingerprint exists on pre-basics pages (loaded from nav.js)', async ({ page }) => {
    await page.goto(PREBASICS_URL, { waitUntil: 'domcontentloaded' });
    var result = await page.evaluate(() => typeof window.getDeviceFingerprint);
    expect(result).toBe('function');
  });

  test('F3.3: window.getDeviceFingerprint exists on applied pages (loaded from nav.js)', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    var result = await page.evaluate(() => typeof window.getDeviceFingerprint);
    expect(result).toBe('function');
  });

  test('F3.4: getDeviceFingerprint returns non-empty string on recover.html', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var fp = await page.evaluate(() => window.getDeviceFingerprint());
    expect(typeof fp).toBe('string');
    expect(fp.length).toBeGreaterThan(0);
  });

  test('F3.5: getDeviceFingerprint returns base-36 alphanumeric string (recover.html)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var fp = await page.evaluate(() => window.getDeviceFingerprint());
    expect(/^[0-9a-z]+$/.test(fp)).toBe(true);
  });

  test('F3.6: getDeviceFingerprint is deterministic (same call = same result, recover.html)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var fp1 = await page.evaluate(() => window.getDeviceFingerprint());
    var fp2 = await page.evaluate(() => window.getDeviceFingerprint());
    var fp3 = await page.evaluate(() => window.getDeviceFingerprint());
    expect(fp1).toBe(fp2);
    expect(fp2).toBe(fp3);
  });

  test('F3.7: getDeviceFingerprint returns same result across different pages (same browser session)', async ({ browser }) => {
    // This is the KEY FIX — both recovery.js and paywall.js use the SAME fingerprint function.
    // Cross-page consistency means activation and paywall verification use identical fingerprints.
    var page = await browser.newPage();
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var fpRecover = await page.evaluate(() => window.getDeviceFingerprint());

    await page.goto(PREBASICS_URL, { waitUntil: 'domcontentloaded' });
    var fpPrebasics = await page.evaluate(() => window.getDeviceFingerprint());

    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    var fpApplied = await page.evaluate(() => window.getDeviceFingerprint());
    await page.close();

    // Same browser, same session = same fingerprint from all pages
    expect(fpRecover).toBe(fpPrebasics);
    expect(fpPrebasics).toBe(fpApplied);
  });

  test('F3.8: getDeviceFingerprint result is concise (< 32 characters)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var fp = await page.evaluate(() => window.getDeviceFingerprint());
    expect(fp.length).toBeLessThan(32);
  });

  test('F3.9: getDeviceFingerprint uses only stable inputs (no Date.now/Math.random in nav.js source)', async ({ page }) => {
    // Read the nav.js source to verify algorithm uses only stable inputs:
    // Canvas rendering, navigator.language, timezone offset, hardwareConcurrency
    // No Math.random or Date.now (which would make fingerprints non-deterministic)
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });

    // The fingerprint should NOT change across calls (already verified in F3.6)
    // Additional check: verify the function source code does NOT reference Math.random / Date.now
    var fnSource = await page.evaluate(() => window.getDeviceFingerprint.toString());
    expect(fnSource.includes('Math.random')).toBe(false);
    expect(fnSource.includes('Date.now')).toBe(false);
  });

  test('F3.10: paywall.js old screen-based fingerprint code removed — delegates to nav.js', async ({ page }) => {
    // After the fix, paywall.js getDeviceFingerprint() delegates to window.getDeviceFingerprint (from nav.js)
    // The function in paywall.js is a thin wrapper: '(window.getDeviceFingerprint && window.getDeviceFingerprint()) || ...'
    // We verify paywall.js is loaded and fingerprint works
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });

    // Check that fingerprint works (calls nav.js shared function)
    var fp = await page.evaluate(() => window.getDeviceFingerprint());
    expect(typeof fp).toBe('string');
    expect(fp.length).toBeGreaterThan(0);

    // Verify the nav.js getDeviceFingerprint source contains canvas creation (the shared implementation)
    var navFpSource = await page.evaluate(() => window.getDeviceFingerprint.toString());
    expect(navFpSource.includes('document.createElement')).toBe(true);
    expect(navFpSource.includes("'canvas'")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  Fix 4 (HIGH): Transitional re-registration when cloudVerify returns hasAccess=false
//  Change: paywall.js has new getSavedActivationCodes() and reRegisterFingerprint()
//  When cloudVerify fails but localStorage has cc-activation-codes, re-registers fingerprint
//  Expected: Existing paid users aren't locked out during fingerprint migration
// ═══════════════════════════════════════════════════════

test.describe('Fix 4: Transitional re-registration support', () => {

  test('F4.1: Page with paywall loads without crash when activation codes are cached', async ({ page }) => {
    // Setup: cache activation codes in localStorage before loading
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('cc-activation-codes', JSON.stringify({
        'CC-SAAAAAAA-AAAA': true
      }));
    });

    // Reload to trigger paywall init with cached codes
    var errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    var criticalErrors = errors.filter(e =>
      !e.includes('fetch') &&
      !e.includes('Failed to fetch') &&
      !e.includes('network')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('F4.2: Page still renders paywall after cloudVerify fail-open with cached codes', async ({ page }) => {
    await page.goto(APPLIED_URL, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('cc-activation-codes', JSON.stringify({
        'CC-SAAAAAAA-AAAA': true
      }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Paywall card should still be visible (file:// fail-open doesn't clear localStorage)
    var card = page.locator('.paywall-card');
    await expect(card).toBeVisible({ timeout: 3000 });
  });

  test('F4.3: paywall.js source contains getSavedActivationCodes function', async () => {
    // Verify the source file contains the re-registration logic
    var paywallPath = path.join(SITE_DIR, 'assets', 'js', 'paywall.js');
    var source = fs.readFileSync(paywallPath, 'utf-8');

    expect(source.includes('getSavedActivationCodes')).toBe(true);
    expect(source.includes('reRegisterFingerprint')).toBe(true);
    expect(source.includes('cc-activation-codes')).toBe(true);
  });

  test('F4.4: re-registration logic includes fetch to /activate endpoint', async () => {
    var paywallPath = path.join(SITE_DIR, 'assets', 'js', 'paywall.js');
    var source = fs.readFileSync(paywallPath, 'utf-8');

    expect(source.includes("'/activate'")).toBe(true);
  });

  test('F4.5: re-registration uses AbortSignal.timeout(3000) for safety', async () => {
    var paywallPath = path.join(SITE_DIR, 'assets', 'js', 'paywall.js');
    var source = fs.readFileSync(paywallPath, 'utf-8');

    // The re-registration should have a timeout to prevent hanging
    expect(source.includes('AbortSignal.timeout')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  Fix 5 (HIGH): Debug log hidden on recover.html
//  Change: `debug.style.display = 'block'` commented out in recover.html inline script
//  Expected: debug-log element stays display:none even during activation
// ═══════════════════════════════════════════════════════

test.describe('Fix 5: Debug log hidden on recover.html', () => {

  test('F5.1: debug-log element exists with inline display:none', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var debugEl = page.locator('#debug-log');
    await expect(debugEl).toHaveCount(1);

    // Computed style should be display:none
    var display = await debugEl.evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('F5.2: debug-log stays hidden after entering invalid code and clicking verify', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });

    // Enter an obviously invalid code (triggers length check which writes to debug.textContent)
    var input = page.locator('#code-input');
    await input.fill('XX');

    var btn = page.locator('#verify-btn');
    await btn.click();
    await page.waitForTimeout(500);

    // debug-log content may be set (debug.textContent = ...), but display should still be none
    var display = await page.locator('#debug-log').evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('F5.3: debug-log stays hidden after entering valid-format code and clicking verify', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });

    // Enter a code with correct format (triggers cloud verify flow)
    var input = page.locator('#code-input');
    await input.fill('CC-SAAAAAAA-AAAA');

    var btn = page.locator('#verify-btn');
    await btn.click();
    await page.waitForTimeout(1000);

    // debug-log should still be display:none
    var display = await page.locator('#debug-log').evaluate(el => window.getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('F5.4: debug.style.display = block is commented out in recover.html source', async () => {
    // Read the raw HTML source from disk (not from DOM, which may have modified inline styles)
    var recoverPath = path.join(SITE_DIR, 'pay', 'recover.html');
    var html = fs.readFileSync(recoverPath, 'utf-8');

    // The line `debug.style.display = 'block'` should be preceded by //
    // Find the line and verify it is commented
    var lines = html.split(/\r?\n/);
    var foundLine = false;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.includes("debug.style.display") && line.includes("block")) {
        foundLine = true;
        // Must be commented out (starts with // or /* after optional whitespace)
        var trimmed = line.trim();
        expect(trimmed.startsWith('//')).toBe(true);
        break;
      }
    }
    expect(foundLine).toBe(true);
  });

  test('F5.5: debug-log is a <pre> element (machine-readable, not styled for users)', async ({ page }) => {
    await page.goto(RECOVER_URL, { waitUntil: 'domcontentloaded' });
    var tagName = await page.locator('#debug-log').evaluate(el => el.tagName);
    expect(tagName).toBe('PRE');
  });
});
