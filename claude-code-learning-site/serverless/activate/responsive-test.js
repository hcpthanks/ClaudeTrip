'use strict';
/* ═══════════════════════════════════════════════════════
   Responsive Screenshot Test — localhost version
   ═══════════════════════════════════════════════════════ */

const { test } = require('@playwright/test');
const path = require('path');

const BASE = 'http://localhost:3335';

const BREAKPOINTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'ipad-1024', width: 1024, height: 768 },
];

const PAGES = [
  { name: 'home', url: '/index.html' },
  { name: 'recover', url: '/pay/recover.html' },
];

for (const bp of BREAKPOINTS) {
  for (const pg of PAGES) {
    test(`${pg.name} @ ${bp.name} (fixed)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(BASE + pg.url, { waitUntil: 'networkidle', timeout: 10000 });

      // Check for horizontal overflow
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 5;
      });

      // Check nav
      const navLinks = page.locator('.nav-links');
      const navToggle = page.locator('#nav-toggle');
      const navVisible = await navLinks.isVisible().catch(() => false);
      const toggleVisible = await navToggle.isVisible().catch(() => false);

      // Check hamburger menu
      let hamburgerWorks = false;
      if (toggleVisible) {
        await navToggle.click();
        await page.waitForTimeout(200);
        const menu = page.locator('#mobile-menu');
        hamburgerWorks = await menu.evaluate(el => el.classList.contains('open'));
        // Close it
        await menu.locator('a').first().click();
        await page.waitForTimeout(200);
      }

      await page.screenshot({
        path: path.resolve(__dirname, `screenshots/${pg.name}-${bp.name}-fixed.png`),
        fullPage: true,
      });

      console.log(`  ${pg.name} @ ${bp.name}: nav=${navVisible} hamburger=${toggleVisible}(${hamburgerWorks}) overflow=${overflowX}`);
    });
  }
}
