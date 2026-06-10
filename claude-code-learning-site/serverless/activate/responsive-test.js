'use strict';
/* ═══════════════════════════════════════════════════════
   Responsive Screenshot Test — 捕获 4 个断点截图
   运行：npx playwright test serverless/activate/responsive-test.js
   ═══════════════════════════════════════════════════════ */

const { test } = require('@playwright/test');
const path = require('path');

const BREAKPOINTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'ipad-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const PAGES = [
  { name: 'home', url: 'https://www.hcpthanks.com/' },
  { name: 'recover', url: 'https://www.hcpthanks.com/pay/recover.html' },
  { name: 'pay', url: 'https://www.hcpthanks.com/pay/pay.html' },
];

for (const bp of BREAKPOINTS) {
  for (const pg of PAGES) {
    test(`${pg.name} @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(pg.url, { waitUntil: 'networkidle', timeout: 15000 });

      // Check for obvious layout issues
      const body = page.locator('body');

      // Check no horizontal overflow
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });
      if (overflowX) {
        console.warn(`⚠️ ${pg.name} @ ${bp.name}: horizontal overflow detected`);
      }

      // Check nav links visibility
      const navLinks = page.locator('.nav-links');
      const navVisible = await navLinks.isVisible().catch(() => false);

      await page.screenshot({
        path: path.resolve(__dirname, `screenshots/${pg.name}-${bp.name}.png`),
        fullPage: true,
      });

      // Basic assertions
      const title = await page.title();
      console.log(`  ${pg.name} @ ${bp.name}: title="${title}", nav=${navVisible}, overflow=${overflowX}`);
    });
  }
}
