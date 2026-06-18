import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/homepage-all-access.test.js', 'tests/phase1-architecture.test.js', 'tests/phase2-ai-video-factory.test.js'],
    environment: 'node',
    globals: false
  }
});
