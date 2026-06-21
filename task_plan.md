# 任务计划：CLAIW 视频工具整合

## 目标
把 ai-video-factory、scenefab、agnes-ai 三个视频相关系统理清关系，合并为一个统一入口 `/make-video`，消除混乱。

## 当前阶段
阶段 4（方案已设计，待实现）

## 各阶段

### 阶段 1：SceneFab skill 崩溃恢复
- [x] 找到崩掉的上一个会话（session `a4264d9a`）
- [x] 从 JSONL 日志 `e31e5baf-...jsonl` 定位最后一条 Write tool call
- [x] 恢复 SKILL.md 完整内容到 `.claude/skills/scenefab/SKILL.md`（322行）
- [x] 确认文件写入成功
- **状态：** complete

### 阶段 2：三个系统对比分析
- [x] 读取 ai-video-factory SKILL.md + generate_simple_video.py 源码
- [x] 分析 SceneFab 完整源码结构（200+文件，10个LLM后端，6个TTS后端，5个Vision后端）
- [x] 分析 Agnes AI 三种能力（文本/图片/视频）的实际测试状态
- [x] 输出三种系统的分层关系：能力层（Agnes/edge-tts/Qwen/DeepSeek）→ 工具层（脚本）→ 入口层（Skill）
- [x] 对比优势和不足矩阵
- **状态：** complete

### 阶段 3：统一入口方案设计
- [x] 设计 `/make-video` 决策树（三种模式自动选择）
- [x] 模式A：快速出片（文案→配音→黑底，Agnes可选封面）
- [x] 模式B：美颜出片（分段+Agnes配图+B-roll+拼接）
- [x] 模式C：AI解说（视频→分镜→解说词→配音合成，SceneFab）
- [x] Agnes 定位从"独立系统"降级为"素材供应商"
- [x] 写入 plan 文件 `compressed-inventing-cocke.md`
- **状态：** complete

### 阶段 4：实现 make-video skill
- [ ] 创建 `.claude/skills/make-video/SKILL.md`
- [ ] 写完整 Agent SOP（决策树+三种模式详细流程）
- [ ] 更新 CLAUDE.md
- [ ] 测试模式A（基础流水线）
- **状态：** not started

## 关键问题
1. ✅ 三个系统为什么乱？— 名字都带"AI/视频"，但实际分层不同
2. ✅ Agnes 和两个 skill 什么关系？— 供应商和工厂的关系，Agnes是能力API，Skill是生产流程
3. ⏳ SceneFab 真实视频测试 — 还没跑，分镜提示词需要调优
4. ✅ Agnes MCP 视频URL bug — server.py line 205 已修复：5字段尝试 + remixed_from_video_id 拼接 + 空URL调试输出
5. ⏳ CosyVoice2/Qwen3-TTS 本地引擎 — generate_simple_video.py 里是 stub，只有 generate.py 接了

## 已做决策
| 决策 | 理由 |
|------|------|
| 默认走模式A（黑底快速出片） | 用户已验证的工作流，内容为王，不增加复杂度 |
| Agnes只做"锦上添花"，不卡主流程 | Agnes免费但不保证稳定性，失败→黑底兜底 |
| SceneFab只在用户提供视频文件时触发 | 避免误触发付费API（Qwen+DeepSeek） |
| 保留三个旧skill作为参考文档 | 不删已有文档，make-video作为新入口 |
| 分镜结果必须展示给用户 | 直接解决"分镜没有啊"的投诉 |
| 不提问、不重试 | 继承 ai-video-factory 的 SOP 哲学 |

# 命令顾问检查清单

- [ ] git commit + push 完成
- [ ] CLAUDE.md 已更新
- [ ] 双目录同步（不需要，本次仅改 .claude/ 内部文件）
- [x] /save-session 保存 → 2026-06-21-scenefab-skill-session.tmp
- [x] 学习卡生成 → 2026-06-21-视频工具整合-learning-card.html

# 收尾门禁
| # | 检查项 | 本项目是否需要 | 状态 |
|---|--------|:---:|------|
| 1 | git commit + push | ✅ 必须 | ❌ |
| 2 | 更新 CLAUDE.md | ✅ 必须 | ✅（已加SceneFab） |
| 3 | 双目录同步 | ❌ 不适用 | — |
| 4 | /save-session 保存 | ✅ 必须 | ✅ |
| 5 | 学习卡生成 | ✅ 必须 | ⏸ 进行中 |

# 学习目标（本次会话）
- [x] 学会从 JSONL 日志恢复未写入的文件
- [x] 理解三个AI视频工具的层级关系
- [x] 掌握"能力层→工具层→入口层"的分层设计思路
- [x] 学会用决策树设计统一入口（而非让用户记住多个命令）
