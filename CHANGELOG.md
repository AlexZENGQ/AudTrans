# CHANGELOG

> 版本号遵循语义化版本（SemVer）：`MAJOR.MINOR.PATCH`
> 格式参考 [Keep a Changelog](https://keepachangelog.com/)

## [Unreleased]

### Added
（下一版累计，暂无）

### Changed / Fixed
（下一版累计，暂无）

---

## [0.2.0] - 2026-07-16

> **对外上线版**：UI 高级感重设计 + 历史回放 + 上线 GitHub Pages。

### Added
- 上线 GitHub Pages：`https://alexzengq.github.io/AudTrans/`（对外可用，用户无需本地起服务）
- 录音计时器：`HH:mm:ss` 格式，每秒刷新，录音中有红色脉冲圆点指示
- 历史回放「返回录音」按钮：进入历史播放时主区顶部显示返回按钮，点击恢复当前录音视图
- 字号 / 语言持久化：`js/settings.js` 提供 `getSettings / setSettings` 通用接口，启动应用已存值
- 历史侧栏完整连通：显示时间+条数；点击回放；删除按钮二次确认

### Fixed
- **录音计时器不动**：`createTimer.render()` 调用了错误的 `fmt()`（应为 `format()`），被 setInterval 吞错导致永远显示 00:00
- 历史回放无法直接返回录音界面：`replaySession` 清空前破坏正在录音的 DOM 且无返回出口

### Changed
- checklist 风格 UI 高级感重设计：中性灰 3 阶（bg / surface / surface2/3）、大圆角（8-16px）、柔和阴影、Inter 字体、scrollbar 隐约化
- 顶部主题/语言 select 控件化：自定义右下角箭头，统一右对齐，12px 间距
- 控制栏两端对齐：按钮组 vs 字号组分开
- 标注色全部 CSS 变量化（`--marker-filler / weak / sugg / replaced`）+ `text-decoration-thickness: 2px`
- 字幕 interim 阶段纯文本显示（不调 annotate），只在 final 时才标注 → **字幕延迟大幅改善**
- 停止录音弹层：加 30s 超时自动关闭 / Esc 关闭 / DOM 缺失降级原生 `confirm`

### 已知限制
- 浏览器：仅桌面 Chrome / Edge 稳定支持中文识别（Web Speech API 限制）
- 语音识别依赖网络与浏览器默认引擎
- 中文返回无智能标点（v0.3 规划）
- 最长录音时间约 10-20 分钟（浏览器单次识别会话 1-2 分钟，自动重启 10 次上限）

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
