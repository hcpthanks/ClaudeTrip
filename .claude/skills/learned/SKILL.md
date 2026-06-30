---
name: learned
description: 从 CLAW 项目中积累的教训和经验。每次踩坑后自动追加。用于避免重复犯错。
---

# Learned — 经验教训库

## 收录的教训

| # | 日期 | 主题 | 文件 |
|---|------|------|------|
| 1 | 2026-06-23 | Bash `ln`/`cmd //c mklink` 静默失败 | [bash-cmd-mklink-silent-failure.md](bash-cmd-mklink-silent-failure.md) |
| 2 | 2026-06-23 | PowerShell Junction 双重计数陷阱 | [powershell-junction-double-count-trap.md](powershell-junction-double-count-trap.md) |
| 3 | 2026-06-24 | Python ML 依赖防御模式 | [python-ml-dependency-defense.md](python-ml-dependency-defense.md) |
| 4 | 2026-06-24 | AI底图+文字分层抑制公式 | [ai-bg-text-layering-formula.md](ai-bg-text-layering-formula.md) |
| 5 | 2026-06-24 | FFmpeg 静默崩溃诊断 — Command failed with no output | [ffmpeg-silent-crash-diagnosis.md](ffmpeg-silent-crash-diagnosis.md) |

| 6 | 2026-06-26 | Windows HTML→PDF：Playwright 替代 WeasyPrint | [windows-html-to-pdf-playwright.md](windows-html-to-pdf-playwright.md) |
| 7 | 2026-06-26 | 法律条款引用必须核实条款号与版本 | [legal-article-verification-rule.md](legal-article-verification-rule.md) |
| 8 | 2026-06-27 | 法条引用须验证执行路径可行性——不能硬搬法条忽略实际落地难度 | [legal-enforceability-gap-check.md](legal-enforceability-gap-check.md) |
| 9 | 2026-06-27 | Agent 自我修复→删除→再修复死循环——VS Code 终端关闭即终止 | [agent-self-repair-deletion-loop.md](agent-self-repair-deletion-loop.md) |
| 10 | 2026-06-28 | 对抗性文书→和解导向改写：用逻辑滑梯框架转换劳动争议/投诉/律师函的框架 | [adversarial-doc-settlement-rewrite.md](adversarial-doc-settlement-rewrite.md) |
| 11 | 2026-06-30 | CLAUDE.md 修改层次门禁——钱学森五层大厦审核，总体设计部只指路不执行 | [claude-md-layer-gate.md](claude-md-layer-gate.md) |
| 12 | 2026-06-30 | QSS 门禁模板——从 claude-md-layer-gate 提取的 7 元素复用框架 | [gate-template.md](gate-template.md) |
| 13 | 2026-06-30 | QSS 技能创建门禁——创建/修改 skill 前强制回答"最低三问" | [qss-skill-creation-gate.md](qss-skill-creation-gate.md) |
| 14 | 2026-06-30 | QSS 门禁反馈回路——30天回顾、成功指标、learned rule 生成 | [qss-gate-feedback-loop.md](qss-gate-feedback-loop.md) |
| 15 | 2026-06-30 | 框架采用率审计方法——grep引用→深度分级→差距分析→改进建议→HTML报告 | [framework-adoption-audit-method.md](framework-adoption-audit-method.md) |

## 使用方式

当遇到类似问题时，Agent 会自动查阅此目录下的经验文件。也可以在对话中直接说"看看 learned 里有没有类似的经验"来触发检索。
