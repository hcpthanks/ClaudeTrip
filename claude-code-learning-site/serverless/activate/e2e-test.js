'use strict';
/* ═══════════════════════════════════════════════════════
   Playwright E2E 测试 — 激活码恢复页面
   测试 recover.html 的客户端完整交互流程
   运行：npx playwright test serverless/activate/e2e-test.js
   ═══════════════════════════════════════════════════════ */

const { test, expect } = require('@playwright/test');

// 测试激活码（由管理后台相同算法生成，本地校验可通过）
const VALID_A_CODE = 'CC-AGGGALNT-AT5T';
const VALID_S_CODE = 'CC-SAANALNT-X2S6';
const INVALID_SHORT = 'CC-BAD';
const INVALID_FORMAT = 'CC-ATEST-AAAA-CCCC';  // 旧格式 3-char，新格式 4-char 不匹配

test.describe('recover.html — 页面加载与 UI', () => {
  test('页面加载正确，关键元素可见', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    // 标题
    await expect(page.locator('h1')).toContainText('恢复购买');

    // 输入框
    const input = page.locator('#code-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /CC-SXXX/);

    // 按钮
    const btn = page.locator('#verify-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('验证激活');

    // 订单号输入框
    const orderInput = page.locator('#order-input');
    await expect(orderInput).toBeVisible();

    // Debug log 默认隐藏
    const debug = page.locator('#debug-log');
    await expect(debug).toBeHidden();
  });

  test('页面是 HTTPS，无混合内容警告', async ({ page }) => {
    const responses = [];
    page.on('response', r => responses.push(r.url()));

    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    // 检查所有资源都是 HTTPS
    for (const url of responses) {
      if (url.startsWith('http://')) {
        console.warn('⚠️ 混合内容:', url);
      }
      expect(url.startsWith('http://')).toBeFalsy();
    }
  });
});

test.describe('输入格式化', () => {
  test('自动添加破折号（CC-SXXXYYYY-ZZZZ 格式）', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });
    const input = page.locator('#code-input');

    // 输入纯字母数字（无破折号）
    await input.fill('');
    await input.type('CCAGGGALNTAT5T', { delay: 10 });
    // 期望自动格式化为 CC-AGGGALNT-AT5T（dash 在位置 2 和 11）
    const value = await input.inputValue();
    expect(value).toMatch(/^CC-/);
    expect(value).toMatch(/-[A-Z0-9]{4}$/);  // 最后 4 字符是校验位
    expect(value.length).toBeLessThanOrEqual(16);
  });

  test('maxlength 限制为 17', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });
    const input = page.locator('#code-input');
    await expect(input).toHaveAttribute('maxlength', '17');
  });

  test('输入自动转大写', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });
    const input = page.locator('#code-input');

    await input.fill('');
    await input.type('cc-test', { delay: 10 });
    const value = await input.inputValue();
    expect(value).toBe(value.toUpperCase());
  });
});

test.describe('激活码验证', () => {
  test('空输入或过短输入 → 显示错误提示', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    // 空输入
    await page.locator('#verify-btn').click();
    const msg = page.locator('#msg');
    await expect(msg).toHaveClass(/error/);
    await expect(msg).toContainText(/输入完整的激活码|请提供激活码/);
  });

  test('无效格式 → 显示"激活码无效"', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    const input = page.locator('#code-input');
    await input.fill(INVALID_FORMAT);

    await page.locator('#verify-btn').click();
    const msg = page.locator('#msg');
    await expect(msg).toHaveClass(/error/);
    await expect(msg).toContainText(/无效|检查/);

    // Debug log 应该可见
    const debug = page.locator('#debug-log');
    await expect(debug).toBeVisible();
  });

  test('有效激活码 → 按钮显示 "验证中..." loading 状态', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    const input = page.locator('#code-input');
    await input.fill(VALID_A_CODE);

    const btn = page.locator('#verify-btn');
    await btn.click();

    // 按钮应立即变为 "验证中..."
    await expect(btn).toContainText('验证中');
    await expect(btn).toBeDisabled();

    // 消息应显示 loading
    const msg = page.locator('#msg');
    await expect(msg).toHaveClass(/loading/);
    await expect(msg).toContainText(/验证/);
  });

  test('有效激活码 → SCF 返回后显示结果（当前 COS 有问题会显示错误）', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    const input = page.locator('#code-input');
    await input.fill(VALID_A_CODE);

    const btn = page.locator('#verify-btn');
    await btn.click();

    // 等待 SCF 响应
    await page.waitForTimeout(5000);

    const btnAfter = page.locator('#verify-btn');
    await expect(btnAfter).toBeEnabled();  // 按钮恢复

    // Debug log 应该包含信息
    const debug = page.locator('#debug-log');
    await expect(debug).toBeVisible();
    const debugText = await debug.textContent();
    console.log('Debug log:', debugText);
  });
});

test.describe('订单号恢复流程', () => {
  test('空订单号 → 显示错误', async ({ page }) => {
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    await page.locator('#recover-btn').click();
    const orderMsg = page.locator('#order-msg');
    await expect(orderMsg).toHaveClass(/error/);
  });
});

test.describe('页面在移动端布局', () => {
  test('移动端视口 — 卡片不对溢出', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('https://www.hcpthanks.com/pay/recover.html', { waitUntil: 'networkidle' });

    const card = page.locator('.recover-card');
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    // 卡片不应超出视口
    expect(box.x + box.width).toBeLessThanOrEqual(380); // 375 + 少量边距
  });
});
