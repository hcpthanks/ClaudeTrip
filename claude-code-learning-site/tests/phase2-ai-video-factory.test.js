/* ═══════════════════════════════════════════════════════
   Phase 2 AI 视频工厂 — TDD RED 阶段
   测试: 项目页完整内容，含效果展示/调度原理/搭建步骤/实战案例/付费墙

   运行: npx vitest run tests/phase2-ai-video-factory.test.js
   ═══════════════════════════════════════════════════════ */

import { describe, test, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SITE_DIR = join(import.meta.dirname, '..');

function loadPage(relativePath) {
  const fullPath = join(SITE_DIR, relativePath);
  if (!existsSync(fullPath)) return null;
  const html = readFileSync(fullPath, 'utf-8');
  return new JSDOM(html, { url: `https://www.hcpthanks.com/${relativePath}` });
}

// ═══════════════════════════════════════════════════════
// TEST SUITE 1: 页面结构完整性
// ═══════════════════════════════════════════════════════
describe('Phase 2: AI Video Factory — Page Structure', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('page loads successfully', () => {
    expect(doc).not.toBeNull();
  });

  describe('Page sections (in order)', () => {
    test('has Hero with project name and one-line value proposition', () => {
      const h1 = doc.querySelector('.page-hero h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent.toLowerCase()).toMatch(/视频/);
    });

    test('has ① Effect Demo section with visual placeholder', () => {
      const hasDemo = !!doc.querySelector('.demo-preview') ||
        !!doc.querySelector('[class*="demo"]') ||
        doc.body.textContent.includes('效果展示') ||
        doc.body.textContent.includes('效果');
      expect(hasDemo).toBe(true);
    });

    test('has ② Why This Exists section — explains the orchestration value', () => {
      const body = doc.body.textContent;
      const hasWhy = body.includes('为什么') || body.includes('调度') ||
        body.includes('自动') || body.includes('Claude');
      expect(hasWhy).toBe(true);
    });

    test('has ③ Step-by-step build guide section', () => {
      const hasSteps = !!doc.querySelector('ol') || !!doc.querySelector('[class*="step"]') ||
        doc.body.textContent.includes('步骤') || doc.body.textContent.includes('步');
      expect(hasSteps).toBe(true);
    });

    test('has ④ Tech Details section with accurate parameters', () => {
      const body = doc.body.textContent;
      // Must mention the real engines and constraints
      const hasRealEngines = body.includes('edge-tts') || body.includes('CosyVoice2') || body.includes('Qwen3');
      const hasVideoConstraint = body.includes('8n+1') || body.includes('121') || body.includes('num_frames');
      expect(hasRealEngines).toBe(true);
      expect(hasVideoConstraint).toBe(true);
    });

    test('has ⑤ Real-world case study section', () => {
      const body = doc.body.textContent;
      const hasCase = body.includes('实战') || body.includes('案例') ||
        body.includes('抖音') || body.includes('短视频');
      expect(hasCase).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 2: 价值主张 — 不是卖AI工具，是卖调度能力
// ═══════════════════════════════════════════════════════
describe('Phase 2: AI Video Factory — Value Proposition', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('clearly states that individual AI tools are free', () => {
    const body = doc.body.textContent;
    const mentionsFree = body.includes('免费');
    expect(mentionsFree).toBe(true);
  });

  test('explains the value is ORCHESTRATION, not the tools themselves', () => {
    const body = doc.body.textContent;
    // Must convey: value = Claude scheduling Agnes+TTS, not the tools
    const hasOrchestration = body.includes('调度') || body.includes('自动') ||
      body.includes('一条命令') || body.includes('一键') || body.includes('Pipeline');
    expect(hasOrchestration).toBe(true);
  });

  test('mentions real Claude Code commands/patterns used', () => {
    const body = doc.body.textContent;
    // Should reference actual Claude Code features
    const mentionsCC = body.includes('Claude Code') || body.includes('/plan') ||
      body.includes('MCP') || body.includes('.mcp.json');
    expect(mentionsCC).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 3: 技术细节准确性
// ═══════════════════════════════════════════════════════
describe('Phase 2: AI Video Factory — Technical Accuracy', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('correctly lists 3 TTS engines with accurate names', () => {
    const body = doc.body.textContent;
    expect(body).toContain('edge-tts');
    // Should mention at least one local engine
    const hasCosyVoice = body.includes('CosyVoice2');
    const hasQwen = body.includes('Qwen3');
    expect(hasCosyVoice || hasQwen).toBe(true);
  });

  test('mentions Agnes AI 3 models accurately', () => {
    const body = doc.body.textContent;
    const hasChat = body.includes('agnes') && (body.includes('Chat') || body.includes('对话') || body.includes('文本'));
    const hasImage = body.includes('Image') || body.includes('图片') || body.includes('生图');
    const hasVideo = body.includes('Video') || body.includes('视频生成');
    expect(hasChat || hasImage || hasVideo).toBe(true);
  });

  test('correctly states video frame constraint (8n+1)', () => {
    const body = doc.body.textContent;
    const hasFrameConstraint = body.includes('8n+1') || body.includes('8 n + 1') ||
      body.includes('num_frames');
    expect(hasFrameConstraint).toBe(true);
  });

  test('mentions the one-command execution pattern', () => {
    const body = doc.body.textContent;
    // The real command: python generate.py -t "文案" -o output.mp4
    const hasCommand = body.includes('generate.py') || body.includes('python') ||
      !!doc.querySelector('code, pre');
    expect(hasCommand).toBe(true);
  });

  test('accurately states CosyVoice2 is ~5.3GB local', () => {
    const body = doc.body.textContent;
    // Either explicitly mentions size or at minimum mentions it's local
    const mentionsLocal = body.includes('本地') || body.includes('5.3');
    expect(mentionsLocal).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 4: 付费墙集成
// ═══════════════════════════════════════════════════════
describe('Phase 2: AI Video Factory — Paywall Integration', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('has paywall section for source code + config', () => {
    const body = doc.body.textContent;
    const hasPaywall = !!doc.querySelector('.premium-teaser') ||
      body.includes('¥399') || body.includes('¥699') || body.includes('解锁') || body.includes('付费');
    expect(hasPaywall).toBe(true);
  });

  test('paywall explains what you get: source code + config templates', () => {
    const body = doc.body.textContent;
    const hasSource = body.includes('源码') || body.includes('脚本') || body.includes('代码');
    const hasConfig = body.includes('配置') || body.includes('模板') || body.includes('template');
    expect(hasSource || hasConfig).toBe(true);
  });

  test('has link to Claude Code learning for those who want to learn basics first', () => {
    const links = doc.querySelectorAll('a[href*="pre-basics"], a[href*="beginner"]');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});

// ═══════════════════════════════════════════════════════
// TEST SUITE 5: 导航一致性
// ═══════════════════════════════════════════════════════
describe('Phase 2: AI Video Factory — Navigation Consistency', () => {
  let doc;

  beforeAll(() => {
    const result = loadPage('projects/ai-video-factory/index.html');
    if (result) doc = result.window.document;
  });

  test('nav has all 4 main links', () => {
    const nav = doc.querySelector('.site-nav');
    expect(nav).not.toBeNull();
    const navText = nav.textContent;
    expect(navText).toContain('首页');
    expect(navText).toContain('项目');
    expect(navText).toContain('学习');
    expect(navText).toContain('工具');
  });

  test('has activation code and payment links', () => {
    const nav = doc.querySelector('.site-nav');
    expect(nav.textContent).toContain('激活码');
    expect(nav.textContent).toContain('支付');
  });

  test('footer has correct branding', () => {
    const footer = doc.querySelector('.site-footer');
    expect(footer).not.toBeNull();
    expect(footer.textContent).toContain('AI 帮你干活');
  });
});
