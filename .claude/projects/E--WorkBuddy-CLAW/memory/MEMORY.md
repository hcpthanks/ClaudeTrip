# 通用记忆（跨项目）

- [LAW-AI Knowledge Base Status](law-ai-knowledge-base-status.md) — LAW-AI 知识库当前规模：19部法律条例 + 99+例案例 + 12333/12351平台指南，304KB（2026-06-28）

- [Project Location Preference](project-location-preference.md) — All projects on E: drive, never on desktop
- [Douyin Video Style Template](douyin-video-style-template.md) — 抖音知识类视频风格模板，用户发视频时按此风格处理
- [LLM Learning Journey](llm-learning-journey.md) — 用户大模型学习完整档案：背景、进度、偏好、环境配置
- [LLM Learning Log](llm-learning-log.md) — 大模型学习日志：每次学习内容、进度、卡点、心得（用户说「记一下」时追加）
- [Explanation Style Preference](explanation-style-preference.md) — 解释命令/功能时用场景化+实战练习的格式，不要只罗列参数
- [Plan Command Guide](plan-command-guide.md) — /plan 命令完全指南 HTML 文档：E:\WorkBuddy\CLAW\claude-code-plan命令完全指南.html
- [Default User Persona](default-user-persona.md) — 通用产品设计画像：脾气大、智商低、没耐心、小气。管交互/UI/支付流程
- [Plan-TDD Workflow Rule](plan-tdd-workflow-rule.md) — 核心原则：遇到事情先 /plan，确认再 /tdd，永不跳过确认门槛
- [Git Push Credential Rule](git-push-credential-rule.md) — Git push 必须用 -c credential.helper=，已通过 PreToolUse Hook 自动化
- [Content Distribution Rule](content-distribution-rule.md) — 对话内容分发：什么进 CLAUDE.md、什么进 session、什么都不存，由 Claude 自动判断
- [Dev Machine Proxy Setup](dev-machine-proxy-setup.md) — 开发机网络配置：v2rayN SOCKS5 代理，git push 失败时参考

- [Video Download Location](video-download-location.md) — 所有视频下载默认保存到 E:\ZIMEITI\，不是项目目录
- [Dual Directory Sync Rule](dual-directory-sync-rule.md) — CLAW 项目铁律：claude-code-learning-site/ ⇄ docs/ 必须双向同步，commit 前校验，违规自动回滚
- [GitHub Pages Private Pitfall](github-pages-private-pitfall.md) — GitHub Pages 仓库切 Private = 网站立即下线，推荐方案前必须列出副作用
- [Vendor Python Full Copy First](vendor-python-full-copy-first.md) — 集成第三方 Python 项目时先全量搬入再精简，不要提前删文件

## 子项目

- **claude-code-learning-site** → `claude-code-learning-site/.claude/memory/`
- **biaohe** → `biaohe/.claude/memory/`
- [learned-skills-first-check](learned-skills-first-check.md) — 收到问题先搜已学技能和记忆，不要直接开始诊断
- [Settings Override Hierarchy Trap](settings-override-hierarchy-trap.md) — settings 合并层级：local > project > user。改配置前必须 grep 全部文件
- [Bash-PowerShell Escape Rule](bash-powershell-escape-rule.md) — Bash 工具中执行 PowerShell 的唯一可靠方案：写 .ps1 文件 → -File 执行，不要直写 -Command
- [Rules Passive Loading Trap](rules-passive-loading-trap.md) — 规则在 system prompt 里 ≠ 规则会执行；LLM 进入任务模式后可能跳过协议，需主动检查点

## CLAW 项目专用

- [Dev Machine Hardware](dev-machine-hardware.md) — 开发机硬件配置、AMD GPU、显示器、DPI 设置
- [Agnes AI Integration](agnes-ai-integration.md) — Agnes AI 三个免费模型集成详情、API 参数、可靠性记录
- [TTS Video Tool](tts-video-tool.md) — TTS 视频工具三引擎（edge-tts/CosyVoice2/Qwen3-TTS）配置和命令
- [SceneFab Skill](scenefab-skill.md) — AI 影视解说视频生成器流水线、引擎、与 make-video 的关系
- [HeyGen API Key Todo](heygen-api-key-todo.md) — ⏳ 明天申请 HeyGen API Key，品质轨中文配音阻塞项，$5起充
- [About Author Page](about-author-page.md) — 个人主页 hcpthanks.com/about 上线记录
- [Edge Browser Permanent Fix](edge-browser-permanent-fix.md) — Edge 浏览器启动器损坏的三层防护方案
- [Context Overload Prevention](context-overload-prevention.md) — API Error 400 上下文超限事件分析与预防
- [Video Pipeline Recurring Errors](video-pipeline-recurring-errors.md) — AI视频流水线反复出现的三类低级错误：中文编码/帧数不足/Agnes超时
- [Video Pipeline Evolution](video-pipeline-evolution.md) — 视频管线进化史：v1纯黑底→v2Agnes Video→v2.5风格引擎→v3静态帧+淡入淡出（当前最佳）。核心教训：不要为了"像视频"加无意义运动
- [C Drive Minimization Policy](c-drive-minimization-policy.md) — C盘128GB最小化策略：所有AI模型/缓存/下载必须落在E盘，环境变量已锁死，TTS模型junction迁移已完成
- [Learning Card Storage Location](learning-card-storage-location.md) — 学习卡统一存放 E:\WorkBuddy\learning-cards\，不在项目目录或C盘散落
- [Video Three Track Routing](video-three-track-routing.md) — 视频三轨路由：ai-video-factory 唯一入口 → 极速/品质/解说三轨分流 (2026-06-23)
- [Skill Audit 2026-06-23](skill-audit-2026-06-23.md) — 14组件诊断：🟢7 🟡5 🔴2，行动项全部完成
- [Storyboard-Prompter Deleted](storyboard-prompter-deleted-2026-06-29.md) — storyboard-prompter 已删除，核心数据迁至 ai-video-factory/references/visual-styles.md
- [TTS-Video Skill Deleted](tts-video-deleted-2026-06-29.md) — tts-video skill 已删除，工具精简为 generate.py (2026-06-29)
- [TTS Video SRT Fix](tts-video-srt-fix.md) — Windows FFmpeg subtitles filter 路径冒号转义修复
- [SceneFab Skil](scenefab-skill.md) — AI 影视解说视频生成器流水线、引擎、与 make-video 的关系
- [SceneFab API Keys Missing](scenefab-api-keys-missing.md) — QWEN + DEEPSEEK API Key 缺失，解说轨暂不可用
- [Tools Directory Consolidation](tools-directory-consolidation.md) — Shotcut/SoX/CLI-Anything 移到 E:\WorkBuddy\tools\
- [GPT-SoVITS Voice Cloning Setup](gpt-sovits-voice-cloning-setup.md) — GPT-SoVITS 声音克隆安装踩坑存档：5处代码补丁、依赖地狱、CPU推理验证 (2026-06-24)
- [Agent Safety Critical File Protection](agent-safety-critical-file-protection.md) — Agent 失控时关键文件保护：memory/session-data/CLAUDE.md 不可被自动删除，异常立即关终端
