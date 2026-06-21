# 任务计划：个人主页（关于作者）实现

## 目标
在 hcpthanks.com 上新增"关于作者"个人主页（about.html + 首页卡片 + 导航链接），按设计规格书执行。

## 当前阶段
阶段 2

## 各阶段

### 阶段 1：创建完整个人主页 about.html
- [x] 创建 `docs/about.html` — 5 大板块完整页面（Hero + 方法论 + 技能 + 项目 + 联系）
- [x] 使用 common.css 重用设计令牌（通过 link 引用）
- [x] 页面内联样式仅写 about.html 特有样式
- [x] 头像引用 `assets/images/avatar.jpg`
- **状态：** complete

### 阶段 2：修改首页 — 添加作者卡片
- [x] 修改 `docs/index.html` — 在 Hero 下方、作者分享视频上方插入作者卡片区域
- [x] 卡片内容：头像 + "AI创业研究员" + 一句话定位 + "了解更多"按钮
- [x] 样式融合现有深色主题
- **状态：** complete

### 阶段 3：修改导航栏 — 添加"关于作者"链接
- [x] 修改 `docs/assets/js/nav.js` — 桌面导航加"关于作者"链接
- [x] 移动端 hamburger 菜单同步添加
- [x] 指向 `/about`
- **状态：** complete

### 阶段 4：双目录同步
- [x] 同步 `docs/about.html` → `claude-code-learning-site/about.html`
- [x] 同步 `docs/index.html` → `claude-code-learning-site/index.html`
- [x] 同步 `docs/assets/js/nav.js` → `claude-code-learning-site/assets/js/nav.js`
- [x] 同步 `docs/assets/images/avatar.jpg` → `claude-code-learning-site/assets/images/avatar.jpg`
- **状态：** complete

### 阶段 5：验证与交付
- [x] 打开浏览器验证 about.html 完整显示
- [x] 验证首页作者卡片可见
- [x] 验证导航链接工作正常
- [x] 验证移动端响应式
- [x] Commit 到 git
- **状态：** complete

## 关键问题
1. ✅ 姓名：AI创业研究员
2. ✅ 头像：已下载 → docs/assets/images/avatar.jpg
3. ✅ 邮箱：hcpthanks@163.com
4. ✅ GitHub：github.com/hcpthanks

## 已做决策
| 决策 | 理由 |
|------|------|
| 深色主题与学习站一致 | 用户选择，视觉融合 |
| 首页卡片放 Hero 下方独立区 | 用户选择 C 方案 |
| 5 大板块结构 | brainstorming 确认：ABCEF |
| 3 阶段方法论展示技能 | 用户偏好"先行者"叙事 |
| 纯静态 HTML，单文件 | 复用现有架构，零依赖 |

## 备注
- 设计规格书：docs/superpowers/specs/2026-06-21-about-author-page-design.md
- 双目录同步规则必须遵守：docs/ ⇄ claude-code-learning-site/
- 所有页面必须老王友好：零术语、按钮大、操作 ≤3 步
