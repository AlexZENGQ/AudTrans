# ROADMAP

> 项目的真实进度源。**每次完成开发 / 修复 / 重要调研后必须同步更新**。纯查询、未改变项目状态的操作不更新。

## 当前阶段

`v0.1 — MVP 已发布（本地能跑通核心链路，GitHub 已推送）`

## 已完成

- [x] 2026-07-15：初始化仓库、建开源文档基础设施（README / ROADMAP / CONTRIBUTING / CLAUDE / .gitignore）
- [x] 2026-07-15：定义词库数据结构（`data/filler.json`、`data/weak.json`）
- [x] 2026-07-15：选定 UI 原型（`page.png`，typeless 范式）
- [x] 2026-07-15：首次提交（init）全部开源文档与首版词库到 main
- [x] 2026-07-15：建 CHANGELOG.md，记录 Unreleased 下的基础设施 + 词库
- [x] 2026-07-15：加 MIT LICENSE；README 补英文版（双语）+ 顶部跳转 banner
- [x] 2026-07-15：阶段 3 完成 - ASR 流式字幕 + 标注引擎完整实现
- [x] 2026-07-15：三主题切换 + 停止录音二次确认
- [x] 2026-07-15：修推荐词删除线继承 + 停止按钮启用逻辑
- [x] 2026-07-15：**v0.1.0 发版**（CHANGELOG 封存 + 推 GitHub）

## 进行中

（暂无）

## 待办（按执行顺序）

- [x] `v0.1` 接 ASR：`js/asr.js`，封装 Web Speech API 启停、累积 transcript、长录音自动重启
- [x] `v0.1` 接词库：`js/lexicon.js`，加载内置 JSON + 外部 URL 覆盖 / 回退
- [x] `v0.1` 接标注：`js/annotator.js`，filler（红 + 删）/ weak（蓝 + 删 + 建议气泡，可点击接受替换）
- [x] `v0.1` 浏览器实测（按验证清单逐项打勾）
- [x] `v0.1` 导出逻辑（app.js）：清理文本（删 filler、换 weak）+ 复制 / 下载 TXT / 导出 JSON
- [x] `v0.1` 接历史：`js/history.js`，会话增删 + localStorage 持久化 + 导入
- [x] `v0.1` 三主题切换 + 停止录音二次确认
- [x] `v0.1` 修推荐词删除线继承 + 停止按钮启用逻辑
- [ ] **v0.2** 精细化 GUI（历史侧栏完整连通、字号 / 语言持久化、导出更完整）
- [ ] **v0.2** 智能标点
- [ ] **v0.2** 可选：`js/visualizer.js`，Canvas 音量可视化

## 阻塞

（当前无。出现阻塞立刻记录原因和解法方向。）

## v2 展望（不在 v0.2 急）

- Electron / Tauri 桌面壳
- 本地 Whisper 离线识别
- 云端付费 ASR（Deepgram / 讯飞）
- PWA 离线缓存
- 登录 / 历史云同步

## 最近验证

- 2026-07-15：**v0.1.0 发版**。桌面 Chrome 下核心链路自测通过：录音 → 实时字幕 + filler 红删 / weak 蓝删推荐（推荐词无下划线 + hover 才显）；停止按钮录音中变红可点；二次确认弹层跟随主题；三主题切换持久化。推GitHub commit `bfb56ab`。
