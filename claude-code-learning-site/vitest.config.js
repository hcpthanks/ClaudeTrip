import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/homepage-all-access.test.js'],
    environment: 'node',
    globals: false
  }
});
