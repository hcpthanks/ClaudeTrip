const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './serverless/activate',
  testMatch: 'responsive-test.js',
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: false,
  },
  reporter: 'list',
});
