---
name: docs-sync-required
description: 每次改完代码必须同步 docs/ 目录，否则 GitHub Pages 不更新
metadata:
  type: project
---

**关键规则：改完 `claude-code-learning-site/` 下的任何文件后，必须同步到 `docs/` 目录。**

原因：GitHub Pages 配置的是从 `docs/` 目录部署，不是从仓库根目录。只推 `claude-code-learning-site/` 的改动不会更新线上站点。

**Why:** 这个问题已经出现 2 次（应用课 + 预备课第7节），推了代码但线上站点没变化，导致用户以为没做。

**How to apply:** 每次 commit 包含 `claude-code-learning-site/` 的改动后：
1. `cp -r` 对应文件到 `docs/`
2. `git add docs/`
3. commit + push 一起带上 docs/ 的改动

或者更简单：凡是改动 `claude-code-learning-site/` 的文件，同时改动 `docs/` 下的对应文件，一次 commit 一起推。

相关：[[git-push-with-token]]（push 时用 `-c credential.helper=` 避免弹窗）
