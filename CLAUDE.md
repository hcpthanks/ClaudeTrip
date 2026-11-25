# CLAUDE.md — CLAW 项目

## 项目概述

工作台项目，包含多个子项目/站点，以及 AI 工具集成。

## 🧠 最高指导思想：钱学森系统科学

CLAW 项目的所有技能、Agent 编排、架构决策，遵循**钱学森系统科学体系**的指导。详见 `/qian-system-science`。
QSS 与 ECC 的工程对齐关系参见 learned: qss-ecc-alignment。

核心原则：
- **系统工程 = 组织管理的技术** → Agent 编排本身就是系统工程
- **综合集成方法** → 人机结合、以人为主，从定性到定量
- **开放的复杂巨系统** → CLAW 是复杂的 Agent-工具-知识集成系统，需要整体观
- **总体设计部** → 顶层 orchestration 把控全局，避免局部最优
- **五层大厦** → skills(工程技术) → rules(技术科学) → 元技能(基础科学) → 系统论(桥梁) → 哲学

## 🔧 统一工作流：一条流水线，不是两套系统

> **CLAW meta 层（QSS、karpathy、哨兵/顾问、learned）不替代 ECC 执行层的任何工具。它们在各阶段关键节点插桩，施加约束、检测异常、推荐行动、记录教训。不存在"用 CLAW 的 X 还是 ECC 的 Y"——只有"在这个阶段，用哪个工具，受什么约束"。
> 详见学习卡：`E:\WorkBuddy\learning-cards\2026-07-05-CLAW-system-integration-plan.html`**

### 流水线总览

```
用户需求
  │  [哨兵] 重复需求检测（5分钟内同类≥3次→暂停确认）
  │  [顾问] 推荐规划工具入口
  ▼
阶段1: 规划 ── 工具: ECC blueprint / CLAW planning-with-files（按复杂度选）
  │  [karpathy] "先想再写" — 计划未经审查，禁止编码
  │  [QSS] 定性综合集成 — 需求理解清楚了吗？还是急着写代码？
  ▼
阶段2: 执行(TDD) ── 工具: ECC tdd-workflow + 各语言 rules
  │  [karpathy] "精准变更" + "目标驱动" + "简单优先"
  │  [哨兵] 同操作失败≥2次→暂停 | 5分钟内同类≥3次→隐形循环警报
  ▼
阶段3: 验证 ── 工具: ECC verification-loop(6阶段) + CLAW verification-before-completion(铁律)
  │  [QSS] 反馈闭合 — "Evidence before claims, always"
  │  [ECC] eval-harness — pass@k 指标，不只看单次通过
  ▼
阶段4: 审查 ── 工具: ECC code-review + security-review
  │  [karpathy] "精准变更"复审 — diff 中有没有顺路改动？
  │  [哨兵] 安全敏感代码 → 强制 security-review，不可跳过
  ▼
阶段5: 交付 ── 工具: git commit + push（按铁律）
  │  [顾问] 收尾门禁5项逐项通过 → 才能 /clear
  ▼
阶段6: 学习 ── 工具: ECC continuous-learning-v2(自动捕获) + CLAW learned(可读存档)
     [QSS] 螺旋上升 — 这一轮比上一轮多了什么认识？
```

### 阶段触发条件与行为

#### 阶段1：规划
| 触发信号 | 默认工具 | 何时换工具 |
|---------|---------|-----------|
| 用户描述要做的事 | ECC blueprint（依赖 DAG + 多会话支持） | → CLAW planning-with-files（单会话功能开发、需要中文规划文件） |
| 复杂多步骤任务、需要多 Agent 编排 | ECC blueprint（DAG 分解 + 复杂度分层） | — |
| 简单改动（单文件、明确需求） | 跳过规划，直接进入执行 | — |
| 创意工作、设计方向不确定 | CLAW brainstorming（视觉伴侣 + 多方案对比） | — |

**Meta 层插桩：**
- [karpathy: 先想再写] 计划必须经过用户确认，否则禁止进入执行阶段
- [QSS: 定性综合集成] 检查：需求理解清楚了吗？专家经验（用户偏好）用足了吗？
- [QSS: 决策检查清单] 7项系统工程检查（边界清晰？层次对？涌现考虑？反馈闭合？人机结合？开放？去商标化？）+ 4项综合集成检查

#### 阶段2：执行
| 场景 | 默认工具 | 替代工具 |
|------|---------|---------|
| 新功能/改代码 | ECC tdd-workflow | CLAW test-driven-development（需要更严格的铁律执行时） |
| Bug 修复 | CLAW systematic-debugging（根因分析→假设验证→实现） | — |
| 多 Agent 并行 | CLAW subagent-driven-development | ECC Ralphinho DAG（需要合并队列+驱逐恢复时） |
| 编码规范 | ECC coding-standards + 各语言 rules | — |

**Meta 层插桩：**
- [karpathy: 精准变更] 每行改动必须可追溯到用户需求。不"顺路改进"相邻代码
- [karpathy: 目标驱动] 每步有可机器验证的成功标准（不是"把它做好"，是"test X passes"）
- [karpathy: 简单优先] 200行能写成50行 → 重写。不为单次使用写抽象
- [哨兵: 重复重试] 同一操作失败≥2次 → 暂停，不自动重试。发送哨兵询问
- [哨兵: 隐形循环] 5分钟内同类操作≥3次（即使每次都"成功"）→ 暂停检查

#### 阶段3：验证
**触发：** 编码完成后、声称"完成了"之前。CLAW verification-before-completion 铁律：必须先运行验证命令，读取输出，确认通过，然后才能说"完成了"。

**默认工具链：**
1. ECC verification-loop 6阶段（build → types → lint → tests → security scan → diff review）
2. CLAW verification-before-completion 铁律门禁（"Evidence before claims, always"）
3. ECC eval-harness（如果有已定义的 capability/regression evals）

**Meta 层插桩：**
- [QSS: 反馈闭合] 不是"我觉得没问题"，是"build/lint/test/coverage 的实际输出显示通过"

#### 阶段4：审查
| 触发信号 | 工具 | 强制程度 |
|---------|------|---------|
| 任何代码修改 | ECC code-review | 强制（code-reviewer agent） |
| 安全敏感代码（认证/支付/用户数据/加密） | ECC security-review | 强制，不可跳过 |
| 审查反馈不够清晰 | CLAW receiving-code-review | 按需 |

**Meta 层插桩：**
- [karpathy: 精准变更] 复审 diff：有没有顺路改动？有没有"顺便改个格式"？
- [QSS: 去商标化] 复审：关注的是实质功能还是工具/框架的品牌名？
- [哨兵: 质量回退] 如果本轮 diff 质量明显不如上一轮 → 暂停检查

#### 阶段5：交付
**触发：** 验证+审查全部通过后。

**门禁流程（不可跳过，逐项检查）：**
| # | 检查项 | 本项目是否需要 |
|---|--------|:---:|
| 1 | git commit + push 完成 | ✅ 必须 |
| 2 | CLAUDE.md 已更新（如有新规则/教训） | ✅ 必须 |
| 3 | 双目录同步（learning-site ⇄ docs） | ✅ 必须 |
| 4 | /save-session 保存 | ✅ 必须 |
| 5 | 学习卡生成 | ✅ 必须 |

全部通过 → 推荐 /clear。任一项未通过 → 阻止 /clear。

#### 阶段6：学习
**触发：** 阶段完成、/clear 前、或踩坑后。

**默认流程：**
- ECC continuous-learning-v2：Hook 驱动的自动行为捕获 → 生成 instincts + 置信度评分
- CLAW learned：用户/Agent 手动记录教训 → 可读 markdown 存档
- 置信度 ≥ 0.7 的 ECC instinct → 自动建议写入 CLAW learned
- 收尾：3 句话复盘（做了什么/学到什么/能教什么）→ 生成 HTML 学习卡

**Meta 层插桩：**
- [QSS: 螺旋上升] 这一轮的认知比上一轮提升了什么？
- [顾问: 学习闭环] 触发 3 句话复盘引导

### 🎬 视频生产分支：三螺旋流水线

> 视频生产不同于代码生产——没有"编译/测试/lint"的机器可验证标准，但有"竞品分析→风格统一→时长对齐→人工审查"的视频特有闭环。使用 QSS 综合集成三螺旋：研究（定性）→ 生产（定性定量结合）→ 审查（从定性到定量）。

#### 视频研究工具链：agent-reach → browser-use/web-access → VideoDB

```
研究漏斗（从广到深）：
  agent-reach（广度，13平台，分钟级）
    多平台并行搜索 → 50+ 结果
      │
      ▼ 筛选 3-5 条高价值链接
  browser-use 或 web-access（深度，单页面）
    ├─ browser-use: 自治浏览 + 多步骤研究 + 综合报告
    └─ web-access: 你的真实浏览器（登录态+历史+书签+截图）
      │
      ▼
  VideoDB（分析，视频理解）
    竞品视频 → 帧提取 → 节奏分析 → 模式提取
```

| 工具 | 类型 | 适用场景 | 限制 |
|------|------|---------|------|
| **agent-reach** | API/CLI 聚合器（只读） | 多平台并行搜索、标题/评论/字幕抓取、趋势采样 | 无登录态（部分平台需 OpenCLI）、无视觉理解、无交互 |
| **browser-use** | AI Agent 浏览器（读写） | 自治多步骤浏览、表单填写、跨站研究、深度报告 | 自己的浏览器=无现有登录态、需 LLM token |
| **web-access** | CDP 真实浏览器（读写） | 已登录网站、书签历史搜索、动态页面、视频帧截图 | 需 DOM 知识、CDP 可被检测 |
| **VideoDB** | 视频感知+记忆+操作 | 竞品分析、视频索引/搜索、字幕翻译、桌面录屏 | VIDEO_DB_API_KEY 需配置 |

**工具选择规则：**
1. **先 agent-reach，再深挖** — agent-reach 覆盖面最广，先搜出候选列表
2. **需要登录态 → web-access** — 你的浏览器已经登录了所有网站
3. **需要自治探索 → browser-use** — "帮我找关于 X 的 5 个论坛的讨论"这种需要自己判断的任务
4. **需要分析视频 → VideoDB** — 竞品分析、提取节奏模式、自我审查

#### 第一螺旋：研究 + 脚本（定性综合集成）

```
用户: "做视频，主题是 X"
  │  [哨兵] 重复需求检测
  │  [顾问] 路由到 ai-video-factory → 判断品质轨/解说轨
  ▼

1. agent-reach 多平台搜索（并行）
   ├─ Exa/WebSearch: "X 最新数据 2026"
   ├─ 小红书: "X 真实体验" → 用户案例
   ├─ B站: "X 解说" → 竞品视频结构
   ├─ Twitter/Reddit: "X discussion" → 海外视角
   └─ GitHub/播客: 相关项目/深度讨论

2. 筛选高价值链接 → browser-use/web-access 深挖
   ├─ 登录态内容（付费文章/论坛）
   ├─ 动态页面（SPA/React，agent-reach 抓不到的）
   └─ 视觉素材（截图、数据图表、评论原文）

3. VideoDB 竞品分析
   ├─ 摄入 2-3 个竞品视频 → 帧索引 → 节奏分析
   ├─ 提取: 叙事结构、字幕风格、转场模式、时长分布
   └─ 输出: 竞品分析报告 → 指导自己的视频设计

4. prompt-optimizer 脚本评估
   ├─ evaluate_prompt: 信息密度、叙事弧线、逻辑一致性
   ├─ iterate_prompt: 交叉引用 agent-reach 获取的事实
   └─ 用户确认脚本内容

  [karpathy: 先想再写] 脚本未经确认，禁止进入生产
  [QSS: 定性先于定量] 不要跳过研究直接写脚本
  [QSS: 专家经验] 用户确认: 风格方向、核心论点、竞品参照

  产出: 研究笔记 + 竞品分析 + 脚本 v1 + 风格提案
```

#### 第二螺旋：素材 + 合成（定性定量结合）

> **video-use 哲学：脚本作为编辑界面。** LLM 不看视频，它读结构化脚本——就像 browser-use 给 LLM 结构化 DOM 而非截图。编辑决策在文本层完成，FFmpeg/HyperFrames 执行。

```
5. 生成结构化编辑脚本（核心创新 — 来自 video-use）
   ┌──────────────────────────────────────────────────────────────┐
   │ ## S001 (duration: 8.0s, 类型: agnes_image)                  │
   │   [00.00-01.20] MOSS-TTS: "XX 是当今最重要的技术之一"         │
   │   [01.20-08.00] 画面: Agnes Image → 科技感底图               │
   │                  HyperFrames: 标题+关键数字 入场动效          │
   │                                                              │
   │ ## S002 (duration: 6.5s, 类型: agnes_image)                  │
   │   [00.00-02.80] MOSS-TTS: "它正在改变我们的生活方式"           │
   │   [02.80-06.50] 画面: Agnes Image → 场景图                    │
   │                  HyperFrames: 要点列表 逐条浮现               │
   └──────────────────────────────────────────────────────────────┘

   每段包含: 精确 TTS 音频时长 + 画面 prompt + 动效类型
   LLM 在文本层调整节奏（加速/减速/重排），不靠重新渲染判断

6. 风格统一
   └─ prompt-optimizer.optimize_image_prompt → 统一风格描述
      → 所有 Agnes Image + Agnes Video 共用同一风格 prompt
      → 风格一致性: 每个 scene 的 prompt 必须包含风格关键词

7. 素材生成（并行 — 来自 video-use Hard Rule 10）
   ├─ Agnes Image: 静态底图（agnes-image-2.0-flash，免费）
   ├─ Agnes Video: 2s 动态片段（agnes-video-v2.0，免费）
   │   [哨兵 Type1] 同一 prompt 失败≥2次 → 暂停 + 建议降级方案
   │   [降级] Video 失败/超时/429 → 全 Image 方案（不阻塞管线）
   │   [降级] Image 全部失败 → 纯色渐变背景（最低底线，需先告知用户）
   ├─ MOSS-TTS: 生成配音 WAV + 提取精确词级时间戳
   └─ TTS 实际时长 → 自动回写结构化脚本的 duration 字段

8. HyperFrames 合成（HyperFrames 10 条硬规则）
   ┌──────────────────────────────────────────────────────────────┐
   │ 规则 1: 字幕 layer 在所有叠加层之后（z-index 最高）            │
   │ 规则 2: scene duration 从 MOSS-TTS 实际音频时长提取，不估      │
   │ 规则 3: scene 切换点对齐 TTS 词边界（不在词中间切）            │
   │ 规则 4: 每个 scene 边界 30ms 音频 fade（防爆音）              │
   │ 规则 5: 所有 Agnes prompt 经 prompt-optimizer 统一风格        │
   │ 规则 6: 任何降级必须先告知用户确认（"绝不偷偷降级"）           │
   │ 规则 7: 所有中间产物在项目目录，不污染 C 盘（铁律 4）          │
   │ 规则 8: 字体嵌入或系统可用（无字体回退 = 静默失败）            │
   │ 规则 9: 输出分辨率/帧率在渲染前显式声明                        │
   │ 规则 10: 并行场景渲染时使用独立输出目录（防文件冲突）           │
   └──────────────────────────────────────────────────────────────┘

   ├─ 文字动效（hyperframes-animation）
   ├─ 每段文字 dur = 结构化脚本中的实际 TTS 时长
   ├─ 底图 + 文字叠加 → 场景序列
   └─ FFmpeg: 配音 + 画面 + 字幕轨道 → MP4

  [karpathy: 目标驱动] 每段画面可追溯到结构化脚本中的一句
  [karpathy: 精准变更] AI 生成素材不手动微调 — 只改结构化脚本的 prompt 重新生成
  [哨兵 Type3] 检测工具频繁切换（Image→Video→TTS→合成交替）

  产出: 粗剪版 MP4 + 结构化编辑脚本（可追溯）
```

#### 第三螺旋：审查 + 交付 + 学习（从定性到定量）

> **video-use 哲学：自评估循环。** 渲染后自动检查每个关键边界，最多 3 轮修复。剩余问题标出给用户，不无限循环。

```
9. 自评估循环（渲染后自动检查 — 来自 video-use Self-Evaluation Loop）
   渲染完成后，自动检查每个 scene 边界（±1.5s 窗口）:

   ┌──────────────────────────────────────────────────────────────┐
   │ 自动化检查（机器可执行）:                                      │
   │   [ ] 字幕轨道存在且可被 FFmpeg 正常渲染？                     │
   │   [ ] 每段画面 dur 匹配 TTS 实际时长？（±200ms 容差）          │
   │   [ ] 音量跨段一致？（ffprobe loudnorm 分析）                  │
   │   [ ] 无画面黑场？（FFmpeg blackdetect）                       │
   │   [ ] 音频无爆音？（波形尖峰检测，来自 video-use Hard Rule 3）  │
   │   [ ] 视频开头有第一帧可见？（HyperFrames CSS rule）            │
   │                                                              │
   │ 人工检查（需要人类判断）:                                      │
   │   [ ] 画面风格一致性？（prompt-optimizer 风格 prompt 是否贯穿） │
   │   [ ] 内容事实准确性？（agent-reach 交叉引用来源留档）           │
   │   [ ] 配音多音字/错别字？（人工审查 MOSS-TTS 输出）             │
   │   [ ] 竞品对比？（VideoDB 分析自己 vs 参考视频的节奏/时长）     │
   │   [ ] 字幕是否遮挡关键画面？（video-use Hard Rule 1 验证）      │
   │   [ ] 时长是否在目标范围内？                                   │
   └──────────────────────────────────────────────────────────────┘

   自评流程:
   第 1 轮: 自动检查全部 + 修复机器可检测的问题
   第 2 轮: 重新渲染 + 自动检查 + 修复剩余机器问题
   第 3 轮: 最终渲染 + 自动检查。剩余问题 → 标出给用户
   ⚠️ 最多 3 轮。不无限循环。

10. 交付
    [顾问] 收尾门禁 5 项（git 相关项如不适用可跳过）
    成品 MP4 + 审查报告 + 结构化编辑脚本 + 来源引用清单

11. 学习
    [QSS: 螺旋上升] 这版比上一版好在哪？（有 VideoDB 对比数据佐证？）
    [QSS: 反馈闭合] 自评估日志 → 提取可复用模式 → learned
    C-L-v2: 自动捕获本次视频生产的工具使用模式
    learned-sync: 高置信度模式 → 建议写入 learned
    结构化编辑脚本存档 → 下次做类似视频可直接调整而非重写
```

### 工具选择原则

1. **去商标化** — 基于实际质量对比选择，不基于来源标签（是 CLAW 还是 ECC）
2. **Meta 层不替代 Execution 层** — QSS/karpathy/哨兵/顾问 不替代任何执行工具，它们在关键节点施加约束
3. **场景决定工具** — 同一个功能领域（如规划），不同场景用不同工具，不存在"默认优先"
4. **互补优于排他** — 两套系统在同一领域有不同优势时（如 TDD），两者都用：CLAW 出纪律、ECC 出覆盖面
5. **精简优先** — 如果一个功能 ECC 有而 CLAW 无（如 eval-harness），直接用 ECC；反之亦然（如 systematic-debugging）。不因为"没有对应品"而凑合
6. **研究漏斗** — 先广度(agent-reach) → 再深度(browser-use/web-access) → 再分析(VideoDB)，不跳过任何一层

## ⚠️ 铁律

1. **Bash→PowerShell 转义**：写 .ps1 文件 → `-File` 执行。绝不在 `-Command` 中直写含 `$_` / `foreach` / `%` 的代码。详见 [[bash-powershell-escape-rule]]
2. **规则被动加载陷阱**：规则在 system prompt 里 ≠ 会执行。94条MUST义务仅5条机械保障（5.3%）。详见 [[rules-passive-loading-trap]] + learned: ecc-rules-enforcement-audit
3. **双目录同步**：`claude-code-learning-site/` ⇄ `docs/` 必须双向同步，commit 前校验。详见 [[dual-directory-sync-rule]]
4. **C盘最小化**：所有AI模型/缓存/下载/临时文件必须落在 E 盘或 D 盘。`E:\WorkBuddy\cache\`（HF_HOME/TORCH_HOME/PIP_CACHE_DIR/XDG_CACHE_HOME/PYTHONPYCACHEPREFIX）+ `D:\Cache\`（TEMP/TMP/npm）。TTS模型实体在 `E:\WorkBuddy\models\`→junction到`~/.claude/models/`。新装工具时检查默认下载路径。详见 [[c-drive-minimization-policy]]
5. **学习卡存E盘**：所有 `*-learning-card.html` / 操作手册 HTML 统一存 `E:\WorkBuddy\learning-cards\`，不在项目目录或 C 盘散落。详见 [[learning-card-storage-location]]

## 子项目与关键路径

- `claude-code-learning-site/` — 日文小说阅读站（主项目，hcpthanks.com）
- `docs/` — GitHub Pages 发布目录（需与 learning-site 双向同步）
- `everything-claude-code/` — ECC 工具集
- `biaohe/` — 标合项目

## Git

- 分支: `main`
- Push: `git -c credential.helper= push origin main`

## 核心工具速查

| 工具 | 用途 | 入口 | 详情 |
|------|------|------|------|
| Agnes AI | 文本/图片/视频生成 | MCP: `agnes_chat/image/video` | [[agnes-ai-integration]] |
| AI 视频工厂 v3.7 | 双轨制：品质(Agnes Image/Video底图 + HyperFrames动效 + MOSS-TTS) + 解说(scenefab) | `/ai-video-factory` | [[video-pipeline-evolution]] |
| HyperFrames | HTML→MP4 确定性视频渲染 | `npx hyperframes` + 17 skills | [[hyperframes-integration]] |
| SceneFab | AI 影视解说 | `/scenefab` | [[scenefab-skill]] |
| Edge 修复 | 浏览器异常处理 | `~/.claude/scripts/edge-auto-repair.ps1` | [[edge-browser-permanent-fix]] |
| QSS Skill Gate | 技能创建门禁（三层问答 + Hook 注入 + CLI 审计） | `/qss-audit` + PreToolUse Hook `pre:skill:qss-gate` | learned: [[qss-skill-creation-gate]] + [[qss-ecc-alignment]] |
| Anthropic skill-creator | 技能创建工程流水线（测试→benchmark→迭代→打包） | Skill tool 自动触发 | `~/.claude/skills/skill-creator/` |

## 硬件

- AMD RX 580 4GB + Philips 34" 3440×1440@100Hz + 200% DPI。详见 [[dev-machine-hardware]]

## 关键教训

- **上下文超限**：长会话（>200条）及时 `/clear`。详见 [[context-overload-prevention]]
- **哨兵/顾问/学习闭环**：被动规则可能同时失效，需主动检查。详见 [[rules-passive-loading-trap]]
- **哨兵 P0 已部署**：ecc-context-monitor Hook 集成异质循环+静默检测+自限。`~/.claude/sentinel-state.json` + `sentinel-log.jsonl`。详见 `sentinel-p0-hooks` learned rule
- **Agent 失控立即关终端**：发现 agent 反复修改/删除/重建文件 → 直接关闭 VS Code 终端，不等它"自愈"。详见 [[agent-self-repair-deletion-loop]]

<!-- FRAMEPACK MANAGED BLOCK START -->
# Framepack Claude Code Instructions

Framepack is available through the project MCP server.

Project skills are installed under `.claude/skills`. Use `framepack-director`, `framepack-template-fuser`, `framepack-hyperframes-builder`, and `framepack-reference-miner` when the task matches their descriptions. Each skill has a `SKILL.md` index and `references/` with detailed rules, templates, and code patterns — load on demand, do not read all at once.

Use Framepack when the user asks for a polished video, HyperFrames composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Suggested flow:

1. Create a workbench with `npx -y framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
2. Read `FRAMEPACK.md`, then `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Check `ASSET_GAPS.md` for blocking gaps before writing code. If blocking gaps exist, tell the user what assets are needed.
4. Translate fuzzy user intent into concrete visual language, motion language, template route, and implementation plan.
5. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, one animation engine per element, and timeline registration on `window.__timelines`.
6. Record render feedback and next actions in `ITERATIONS.md`.
7. Use `framepack workbench brief --project-dir <dir>` when the user needs a plain-language progress recap.

Fallback command surface: `npx -y framepack mcp --describe`.
<!-- FRAMEPACK MANAGED BLOCK END -->
