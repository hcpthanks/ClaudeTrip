---
name: claude-code-learning-site-project-diary
description: Claude Code 学习网站项目日记 — 每个会话的进度、决策、产出、下一步
metadata: 
  node_type: memory
  type: project
  originSessionId: d9d595e4-dd4a-441d-b6ad-1b61bba071ac
---

# Claude Code 学习网站 — 项目日记

## 2026-06-08：支付安全加固 + 激活码系统 + 付费墙重构

### 今天做了什么

1. **支付流程微信→邮箱** — 支付页展示真实个人收款码，客户扫码后发邮件到 hcpthanks@163.com，作者本地管理后台生成激活码回复
2. **¥1 强制解锁全站删除** — 简化为 ¥5（单主题）和 ¥99（全站）两档
3. **激活码生成从客户端移除** — `generateActivationCode` 不再暴露到 `window`，仅作者本地 admin 工具可生成
4. **管理后台升级** — 密码门（SHA-256，3次锁定5分钟）+ 支付记录 + CSV导入导出 + 选题下拉排除免费主题
5. **付费墙提前到第④步** — 10个收费课程页统一：①-③免费预览，④-⑨付费，批量脚本处理
6. **付费页精简** — pay.html 从390行砍到130行，只保留 ¥99 永久解锁；¥5 仅在课程页付费墙显示
7. **导航简化** — 课程页顶栏移除17个主题链接，只显示分区；module-nav 改为水平滚动+滚动高亮
8. **激活码长度 Bug 修复** — 格式 `CC-XXXX-XXXX` 总共12字符，代码检查写成了 `< 13`
9. **全站过期文案修正** — "前5模块免费"→"前三步免费"，"微信客服"→"邮箱"，新增进阶/专家标记
10. **Git alias 固化** — `git push/pull/fetch` 全局 alias 自动注入 `-c credential.helper=`

### 关键决策

| 决策 | 结论 |
|------|------|
| 支付方式 | 个人收款码零成本起步，不走微信商户号 |
| 联系方式 | 邮箱 hcpthanks@163.com 替代微信 |
| 激活码工具 | 纯本地，不部署，多电脑通过 git clone + CSV导入迁移 |
| 付费墙位置 | 应用课+入门课 ④步开始；预备课全部免费 |
| 定价 | ¥5单页（仅课程页付费墙）+ ¥99全站（支付页） |
| 部署 | GitHub Pages 从 docs/ 部署，改源码必须同步 docs/ |

### 技术踩坑

- **激活码长度**：`CC-SBTT-JBZL` = 12字符，检查写成 `length < 13` 拦截了所有合法码
- **URL路径**：自定义域名 `www.hcpthanks.com` 直指仓库根，不需要 `/ClaudeTrip/` 前缀
- **anti-theft.js**：拦截了 F12 / Ctrl+Shift+I / 右键，导致无法开DevTools调试
- **docs/ 同步**：改源码必须同步 docs/（GitHub Pages部署目录）
- **Git push**：Windows 上 `git -c credential.helper= push` 避免弹 credential manager
- **DeepSeek子代理**：报 400 `thinking options type cannot be disabled when reasoning_effort is set`

### 关联记忆

- [[learning-site-technical-facts]] — 域名/部署/激活码/定价等关键数据
- [[default-user-persona]] — 产品设计画像
- [[learning-site-paying-user-persona]] — 付费用户画像

## 2026-06-10：SCF COS修复 + 首页改版 + 移动端适配 + 进阶课程 + 21天计划

### 今天做了什么

1. **SCF COS 访问修复** — 根因 `TENCENTCLOUD_SECRETKEY` 为 undefined，SCF_COS_Access 运行角色未正确绑定。重新保存角色后凭证注入正常，5个curl场景全部通过
2. **SCF 调试增强** — 添加 `_dbg`/`_env` 诊断字段，定位 credential 缺失。最终版本移除诊断代码，保留凭证 guard
3. **recovery.js 格式修复** — 正则从 3-char 改为 4-char 随机部分，与 SCF/admin 一致
4. **首页文案改版（面向老王）** — H1 "不用写代码，不用学英语 / AI帮你干活"（小字灰色+大字蓝色）；口号前置 "让每个人都能用 AI"；删除副标题；stats 从数字改为利益点（从开机开始教/写文案回消息算账/和刷抖音一样简单）；meta/title/footer 同步更新
5. **Hero 行间距加大** — h1 margin-bottom 8→20px、tagline 16→24px、badge-row 新增 28px、stats 32→40px、stat-label 4→8px
6. **移动端响应式适配** — hamburger 菜单（≤768px 三线动画+全屏覆盖+点击自动关）、badge 行横向滚动、新 480px 断点（topic grid 单列）、面包屑滚动。覆盖 index+pay/*+所有课程页（nav.js 统一渲染）
7. **进阶课程 4 个主题上线** — 从《Claude Code 日常练习指南》拆解：核心命令精通/上下文成本管理/工作流实战/21天计划。替换首页进阶区灰色占位卡
8. **21天计划第一周详细教程** — 14个任务每个添加可展开的"怎么做"区域（步骤+示范文本+常见问题）。第二、三周待补
9. **视频播放组件** — common.css 添加 .video-wrap/.video-16x9/.video-caption；install-claude-code.html 添加 B站嵌入+mp4 两种样板
10. **B站教程文档** — E:\B站视频嵌入教程-给学习站加视频.md（注册→上传→嵌入→推送全流程）
11. **recover.html 自动格式化修复** — 破折号位置 pos 7→11（16字符格式）；docs API_BASE 更新为正确的 SCF URL
12. **12 个本地单元测试** — serverless/activate/index-test.js（全部通过）
13. **Playwright E2E 测试** — 响应式 6/6 通过；激活码流程 10/11 通过
14. **压缩两个 commit 为一个** — feat: 首页改版 + 移动端响应式适配

### 关键决策

| 决策 | 结论 |
|------|------|
| SCF 凭证方案 | 运行角色绑定 > metadata 服务（移除 getCredentials 代码） |
| 首页 slogan | "让每个人都能用 AI"（用户选 C，阿里体，聚焦用户） |
| 进阶课形式 | 展开式详细教程（同一页点开）> 42个独立页面 |
| 视频方案 | B站嵌入为主（零成本+CDN+用户群匹配），本地mp4为辅 |
| 课程路线 | 两条轨道：老王线（预备→应用→入门→进阶）+ 开发者线（专家，暂不做） |
| 不深入 claude-howto MCP/Agent | 老王不需要，那是开发者内容 |

### 技术要点

- SCF 临时凭证由运行角色注入环境变量 `TENCENTCLOUD_SECRETID/SECRETKEY/SESSIONTOKEN`
- 函数 URL 参数兼容模式必须开启（不开=error 145）
- COS 手动签名需 HMAC-SHA1 hex string 作为 SignKey（Tencent 特殊要求）
- Node.js 纯手写 ZIP 格式替代 PowerShell Compress-Archive（规避中文路径编码问题）
- hamburger 菜单用 CSS `display:none/flex` + classList toggle，零依赖
- 21天计划 localStorage 进度持久化（`cc-21day-progress`）

### 待办

- 21天计划第二、三周详细教程
- B站视频录制 + 嵌入课程页实测
- 专家课程开发
- 浏览器 E2E 激活码完整流程测试

### 关联记忆

- [[learning-site-technical-facts]] — 域名/部署/激活码/定价
- [[default-user-persona]] — 通用产品设计画像
- [[learning-site-paying-user-persona]] — 付费用户画像
