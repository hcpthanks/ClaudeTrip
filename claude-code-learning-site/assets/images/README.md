# 图片资产规范

## 目录结构

```
assets/images/
├── screenshots/          # 静态截图（PNG 格式）
│   ├── pc-basics-01-desktop.png
│   ├── pc-basics-02-taskbar.png
│   ├── pc-basics-03-startmenu.png
│   ├── pc-basics-04-file-vs-folder.png
│   ├── pc-basics-05-open-folder.png
│   ├── pc-basics-06-window-controls.png
│   ├── open-ps-01-search.png
│   ├── open-ps-02-search-result.png
│   ├── open-ps-03-opened-window.png
│   ├── open-ps-04-rightclick.png
│   ├── open-ps-05-full-window.png
│   ├── install-cc-01-nodejs-site.png
│   ├── install-cc-02-download.png
│   ├── install-cc-03-installer.png
│   ├── install-cc-04-node-version.png
│   ├── install-cc-05-npm-install.png
│   ├── install-cc-06-claude-version.png
│   ├── first-chat-01-launch.png
│   ├── first-chat-02-login.png
│   ├── first-chat-03-welcome.png
│   ├── first-chat-04-first-message.png
│   ├── first-chat-05-thinking.png
│   ├── file-basics-01-pwd.png
│   ├── file-basics-02-ls.png
│   ├── file-basics-03-cd-desktop.png
│   ├── file-basics-04-ls-desktop.png
│   ├── troubleshoot-01-error-example.png
│   ├── troubleshoot-02-printscreen-key.png
│   ├── troubleshoot-03-copy-error.png
│   ├── troubleshoot-04-ask-ai.png
│   └── troubleshoot-05-error-list.png
├── gifs/                 # 操作演示 GIF/视频
│   ├── pc-basics-overview.mp4
│   ├── open-ps-search.mp4
│   ├── open-ps-rightclick.mp4
│   ├── install-cc-full.mp4
│   ├── first-chat-full.mp4
│   ├── file-basics-nav.mp4
│   └── troubleshoot-flow.mp4
└── README.md             # 本文件
```

## 截图规范

- **分辨率**：1280×720（或等比例 16:9）
- **格式**：PNG（无损）
- **标注方式**：不要在图片里画标注，用 CSS `.annotate-box` 和 `.annotate-arrow` 叠加
- **命名**：`{topic-id}-{step}-{描述}.png`
- **压缩**：截图后用 TinyPNG 或类似工具压缩（目标 <200KB/张）

## GIF/视频规范

- **时长**：10-30 秒
- **格式**：MP4（用 `<video>` 标签加载，不用 .gif）
- **分辨率**：1280×720
- **帧率**：15fps 即可
- **无声**：不需要声音
- **内容**：从头到尾完整操作流程，关键步骤停顿 1-2 秒
- **录制工具推荐**：ScreenToGif（免费，Windows）

## 鼠标光标

录 GIF 时建议放大鼠标光标或使用高亮工具，让用户清楚看到点击位置。

## 版本标记

每张截图的 figcaption 里标注 Windows 版本（如 "Windows 10"），方便未来更新时识别哪些截图需要重做。
