# ⌨️ kkkyyy — Code Time Tracker

> 🎯 一键记录编程时间，可视化每日编码数据

**Data** → `~/.local/share/kkkyyy/code-time.json` (JSON)

**Theme** → Catppuccin Macchiato

---

## 📦 Changelog
### v1.2.0 - shutdown heart record
- 🛑 退出应用时自动保存当前活跃 session，下次启动可恢复

### v1.1.0 — Live Recording

- ⏺️ 一键「开始记录/停止记录」按钮，实时录制编码时长
- ⏱️ 实时计时器（`HH:MM:SS`），每秒刷新
- 📊 录制中条形图每 5 秒自动更新，今日柱状动态增长
- 💾 退出应用时自动保存当前活跃 session，下次启动可恢复
- 🎨 按钮配色：录制中 🔴 停止 / 空闲时 🟢 开始

### v1.0.0 — Initial Release

- 📖 从 Obsidian 日志 (`code-time.md`) 解析编码 session
- 📊 Canvas 柱状图展示每日编码时长
- 📋 统计卡片：总编程时间、总天数、日均
- 🎨 Catppuccin Macchiato 深色主题
