# ⌨️ kkkyyy — Code Time Tracker
<img width="730" height="1018" alt="Pasted image (6)" src="https://github.com/user-attachments/assets/018b5694-0105-4e7d-984e-8bb8cb4fb7fe" />


> 🎯 一键记录编程时间，可视化每日编码数据

**Data** → `~/.local/share/kkkyyy/code-time.json`

**Theme** → Catppuccin Macchiato

---

## 📦 Changelog

### v1.7.1
- 日历添加星期七，并修复了 1.7.0 版本中日历中鼠标经过，数据偏移的问题

### v1.7.0 — Zoom Fix
- 🔍 `Ctrl + 滚轮` 页面缩放（0.5x～2x），采用 CSS zoom，日历/图表同步无偏移

### v1.6.0 — Ctrl+Wheel Zoom
- 🔍 `Ctrl + 滚轮` 整体页面缩放，范围 -3～5 级

### v1.5.0 — Calendar Refine
- 🗓️ GitHub 风格日历热力图，空日期显示灰色格
- 🎨 固定 1h 间隔分色：无记录/<1h/1h–2h/2h–3h/≥3h
- 🔍 鼠标悬浮显示具体日期和编码时长

### v1.3.0 — Stable Recording
- 🛡️ 心跳保护：系统崩溃/关机时自动保存 session，最多丢失 30s
- ⏸️ 合盖休眠自动结束录制，恢复后 UI 同步刷新
- 📊 顶部统计数据每秒实时更新
- 📈 柱状图自适应标签密度，避免日期重叠

### v1.2.0
- 💾 `will-quit` 退出时自动保存活跃 session

### v1.1.0 — Live Recording
- ⏺️ 一键「开始记录/停止记录」按钮
- ⏱️ 实时计时器（`HH:MM:SS`），每秒刷新
- 📊 录制中条形图每 5 秒自动更新

### v1.0.0 — Initial Release
- 📖 从 Obsidian 日志解析编码 session
- 📊 Canvas 柱状图展示每日编码时长
- 📋 统计卡片：总编程时间、总天数、日均
- 🎨 Catppuccin Macchiato 深色主题
