# CHANGELOG

> 版本号遵循语义化版本（SemVer）：`MAJOR.MINOR.PATCH`
> 格式参考 [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

### Added
（下一版累计，暂无）

### Changed / Fixed
（下一版累计，暂无）

---

## [0.1.0] - 2026-07-15

> **首个 MVP 版本**：网页版实时字幕工具，浏览器打开即用。

### Added
- 项目开源基础设施：README（中英双语，顶部跳转 banner）/ ROADMAP / CONTRIBUTING / CLAUDE / .gitignore / CHANGELOG / LICENSE（MIT，版权人 AudTrans Contributors）
- 词库数据：`data/filler.json`（语气词，32 条）、`data/weak.json`（弱表达，15 条含建议）；支持外部 URL 覆盖 + 失败回退
- UI 骨架：参照 `page.png`（typeless 范式），顶部 / 侧栏 / 舞台（字幕 + 导出）/ 底部控制栏
- 语音识别：`js/asr.js` 基于 Web Speech API，中文优先、流式 interim/final、长录音自动重启
- 字幕流：`js/app.js` SubtitleFlow 管理「同句话同一位置由灰变白」
- 标注引擎：`js/annotator.js` 语气词**红删** / 弱表达**蓝删 + 行内推荐词（可点击接受替换）**；弱多模式合并单正则去重
- 三主题切换：暗色 / 亮色 / Notion 风；全局 + 标注颜色联动；localStorage 持久化
- 停止录音二次确认：自定义弹层（跟随主题，点背景取消）
- 导出：复制清理文本 / 下载 TXT / 导出 JSON（会话清理：删 filler、换弱表达）
- 历史模块：`js/history.js` 会话 CRUD + localStorage 持久化

### Fixed
- 推荐词 `weak-sugg` 嵌套在 `mark-weak` 内被父元素 `line-through` 继承的问题（加 `text-decoration:none + inline-block` 阻断）
- ASR `onStart` 回调漏写 `stopBtn` 启用 / `startBtn` 禁用，导致停止按钮一直置灰

### Changed
- 标注颜色全部 CSS 变量化，为多主题切换做准备

### 已知限制
- 浏览器：仅桌面 Chrome / Edge 稳定支持中文识别（Web Speech API 限制）
- 语音识别依赖网络与浏览器默认引擎
- 中文返回无智能标点（v2 展望）

---

## 发版约定

每次发版时，把 `[Unreleased]` 下的内容移到新版本号段落，并标注日期。

```
## [0.1.0] - 2026-07-15

### Added
- ...
```
