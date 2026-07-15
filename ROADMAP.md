# ROADMAP

> 项目的真实进度源。**每次完成开发 / 修复 / 重要调研后必须同步更新**。纯查询、未改变项目状态的操作不更新。

## 当前阶段

`v0.1 — MVP：可运行的最小可用版本（本地能跑通核心链路）`

## 已完成

- [x] 2026-07-15：初始化仓库、建开源文档基础设施（README / ROADMAP / CONTRIBUTING / CLAUDE / .gitignore）
- [x] 2026-07-15：定义词库数据结构（`data/filler.json`、`data/weak.json`）
- [x] 2026-07-15：选定 UI 原型（`page.png`，typeless 范式）

## 进行中

- [ ] `v0.1` 搭建三件套骨架（`index.html` / `styles/main.css` / `js/app.js`），UI 布局参照 `page.png`，含浏览器兼容检测占位

## 待办（按执行顺序）

- [ ] `v0.1` 接 ASR：`js/asr.js`，封装 Web Speech API 启停、累积 transcript、长录音自动重启
- [ ] `v0.1` 接词库：`js/lexicon.js`，加载内置 JSON + 外部 URL 覆盖 / 回退
- [ ] `v0.1` 接标注：`js/annotator.js`，filler（红 + 删）/ weak（蓝 + 删 + 建议气泡，可点击接受替换）
- [ ] `v0.1` 接导出：`js/export.js`，清理文本（删 filler、换 weak）+ 复制 / 下载 TXT / 导出 JSON
- [ ] `v0.1` 接历史：`js/history.js`，会话增删 + localStorage 持久化 + 导入
- [ ] `v0.1` 接设置：`js/settings.js`，语言 / 字号 / 词库 URL 持久化
- [ ] `v0.1` 可选：`js/visualizer.js`，Canvas 音量可视化
- [ ] `v0.1` 端到端自测（按 README 验证清单逐项打勾）

## 阻塞

（当前无。出现阻塞立刻记录原因和解法方向。）

## v2 展望（明确不做 MVP）

- Electron / Tauri 桌面壳
- 本地 Whisper 离线识别
- 云端付费 ASR（Deepgram / 讯飞）
- 智能标点
- PWA 离线缓存
- 登录 / 历史云同步

## 最近验证

- 2026-07-15：仓库初始化、文档与词库结构创建完成，**尚未进浏览器实测**（等 `v0.1` 骨架完成后一起验证）
