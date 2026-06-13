---
name: learning-site-technical-facts
description: Claude Code 学习站关键数据 — 域名/部署/激活码/定价/密码/路径 速查
metadata: 
  node_type: memory
  type: project
  originSessionId: d9d595e4-dd4a-441d-b6ad-1b61bba071ac
---

# Claude Code 学习站 — 技术事实速查

## 域名 & 部署

| 项 | 值 |
|------|-----|
| 自定义域名 | `www.hcpthanks.com`（CNAME 指向 GitHub Pages） |
| GitHub Pages 旧地址 | `hcpthanks.github.io/ClaudeTrip/`（访问会 301 到自定义域名） |
| 部署源 | `docs/` 目录（GitHub Pages 设置） |
| 仓库 | `github.com/hcpthanks/ClaudeTrip` |
| 本地源码 | `E:\WorkBuddy\CLAW\claude-code-learning-site\` |
| 本地部署目录 | `E:\WorkBuddy\CLAW\docs\` |

**🔴 重要：** 自定义域名直接服务仓库根，URL 不需要 `/ClaudeTrip/` 前缀！
- 正确：`https://www.hcpthanks.com/pay/recover.html`
- 错误：`https://www.hcpthanks.com/ClaudeTrip/pay/recover.html`
- **改完源码必须同步到 `docs/` 再提交！**

## 激活码系统

| 项 | 值 |
|------|-----|
| 格式 | `CC-XXXX-XXXX`（12字符，含两个短横） |
| 校验和 | 基于 SECRET_SALT=0xCC1E4 的32位 hash |
| 字符集 | CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'（无 I/O/0/1） |
| 生成 | 仅本地 `admin/generate-code.html`，不部署 |
| 验证 | `recovery.js` — `window.verifyActivationCode()` |
| 主题映射 | TOPIC_ORDER[0..16] → CHARS[1..17] |

## 管理后台

| 项 | 值 |
|------|-----|
| 路径 | `admin/generate-code.html`（双击打开，仅本地） |
| 密码 | `075785hcP`（SHA-256 验证） |
| 锁定 | 3次错误锁5分钟 |
| 数据 | localStorage `cc-admin-records` |

## 内容分层

| 分区 | 主题数 | 目录 | 免费范围 | 付费墙 |
|------|--------|------|----------|--------|
| 预备课 | 7 (pc-basics~deepseek) | pre-basics/ | 全部免费 | 无 |
| 应用课 | 4 (ai-for-business~bridge-to-coding) | applied/ | ①-③免费 | ④-⑨付费 |
| 入门 | 6 (intro~workflow) | beginner/ | ①-③免费 | ④-⑨付费 |
| 进阶 | 待开发 | intermediate/ | 全部收费 | 全页付费 |
| 专家 | 待开发 | expert/ | 全部收费 | 全页付费 |

## 定价

| 方案 | 价格 | 显示位置 |
|------|------|----------|
| 单页解锁 | ¥5 | 仅课程页付费墙（paywall-card） |
| 全站永久 | ¥99 | 课程页付费墙 + pay.html |

## anti-theft.js 行为

- 拦截 F12 / Ctrl+Shift+I / Ctrl+Shift+J → 无法开 DevTools
- 拦截 Ctrl+U / Ctrl+S / Ctrl+P
- 拦截右键菜单（contextmenu）
- localhost/127.0.0.1 完全跳过所有限制

## Git 操作

```bash
# Windows 上必须用 -c credential.helper= 避免弹窗
git -c credential.helper= push
git -c credential.helper= pull
git -c credential.helper= fetch
```

## 联系

- 邮箱：hcpthanks@163.com
- 收款码路径：`assets/images/wechat-pay-qr.png`（同步到 `docs/assets/images/`）
