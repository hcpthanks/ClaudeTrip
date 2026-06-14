const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: ['tests/pre-basics-integrity.spec.js', 'tests/payment-security.spec.js', 'serverless/activate/responsive-test.js'],
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: false,
  },
  reporter: 'list',
});
