# ROADMAP

> 项目的真实进度源。**每次完成开发 / 修复 / 重要调研后必须同步更新**。纯查询、未改变项目状态的操作不更新。

## 当前阶段

`v0.2 — AudTrans 已上线（对外可用 + UI 高级感 + 历史回放能力）`

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
- [x] 2026-07-16：**v0.2 能力补齐**：历史侧栏完整连通（回放 + 删除 + 返回按钮）+ 字号 / 语言持久化（settings.js）
- [x] 2026-07-16：checklist 风格 UI 高级感重设计（中性灰 + 大圆角 + 柔和阴影 + Inter 字体）
- [x] 2026-07-16：录音计时器（HH:mm:ss 格式 + 红色脉冲圆点 + 停止自动归零）
- [x] 2026-07-16：修计时器不动 bug（fmt→format）+ 历史回放返回录音按钮
- [x] 2026-07-16：**v0.2.0 发版**（CHANGELOG 封存）
- [x] 2026-07-16：**GitHub Pages 上线**（对外可用：https://alexzengq.github.io/AudTrans/）

## 进行中

（暂无）

## 进行中

（暂无）

## 待办（按执行顺序）

- [ ] **v0.3** 智能标点（为中文返回加句号逗号）
- [ ] **v0.3** 可选：`js/visualizer.js`，Canvas 音量可视化
- [ ] **v1.0** 桌面包装（PWA 离线 + 安装到桌面；或 Electron / Tauri 独立桌面应用）
- [ ] **v1.0** 云端付费 ASR 选项（Deepgram / 讯飞）
- [ ] **v1.0** 本地 Whisper 离线识别（无网可用）
- [ ] **v1.0** 登录 / 历史云同步（多端共享）
- [ ] **v1.0** SQLite WASM（大容量历史 + 检索）

## 阻塞

（当前无。出现阻塞立刻记录原因和解法方向。）

## v2 展望（不在 v0.2 急）

- Electron / Tauri 桌面壳
- 本地 Whisper 离线识别
- 云端付费 ASR（Deepgram / 讯飞）
- PWA 离线缓存
- 登录 / 历史云同步

## 最近验证

- 2026-07-16：**v0.2.0 发版 + GitHub Pages 上线**。核心链路实测：录音 → 实时字幕（interim 纯文本 + final 标注）；filler 红删 / weak 蓝删推荐（推荐词不划线 + hover 才显）；停止按钮录音中可点 + 二次确认；三主题切换持久化；历史侧栏回放 + 删除 + 返回录音按钮；计时器 HH:mm:ss 正常走。地址：https://alexzengq.github.io/AudTrans/
