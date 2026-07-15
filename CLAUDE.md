# CLAUDE.md（项目级规范）

本文件是 AudTrans 的项目级规范文档，**全局规则（~/.claude/CLAUDE.md）不能覆盖这里的约定**，项目级优先。

---

## 项目定位

网页版实时字幕工具（typeless 风格）。纯前端、零服务端、无构建。浏览器打开即用，Win/Mac 通吃。

- 语音识别：浏览器内置 **Web Speech API**（v2 前不考虑本地 Whisper / 云端付费 ASR）
- 词库：内置 JSON + 外部 URL 可覆盖
- 历史：localStorage + 导出/导入 JSON，**暂不上数据库**
- 标注：语气词 → 红 + 删；弱表达 → 蓝 + 删 + 行内建议

> 不在 MVP 范围内的功能（桌面壳、离线识别、智能标点、PWA、云同步等）不要主动塞进来。

---

## 目录结构（已建成 / 待建）

```
AudTrans/
├── index.html                   入口（待建）
├── styles/
│   ├── main.css                 全局样式（待建）
│   └── markers.css              标注样式（待建）
├── js/
│   ├── app.js                   入口模块（待建）
│   ├── asr.js                   ASR 封装（待建）
│   ├── annotator.js             标注引擎（待建）
│   ├── lexicon.js               词库加载（待建）
│   ├── history.js               会话历史（待建）
│   ├── export.js                导出（待建）
│   ├── settings.js              设置持久化（待建）
│   └── visualizer.js            音量可视化（待建）
├── data/
│   ├── filler.json              语气词表（✅ 已建）
│   └── weak.json                弱表达词表（✅ 已建）
├── page.png                     UI 参考原型
├── README.md / ROADMAP.md / CHANGELOG.md / CONTRIBUTING.md / LICENSE
└── .gitignore
```

---

## 关键模块职责边界

| 模块 | 职责 | 边界 |
|---|---|---|
| `app.js` | 装配各模块、启动应用、事件总线 | **不写具体业务逻辑** |
| `asr.js` | Web Speech API 启停、流式结果、长录音自动重启 | 不做标注、不做导出 |
| `annotator.js` | filler / weak 匹配、DOM 包装、建议气泡、接受替换 | 不碰 ASR、不碰存储 |
| `lexicon.js` | 加载内置 + 外部 URL 词库、编译正则、回退 | 不生成 DOM |
| `history.js` | 会话增删、localStorage CRUD、导入导出 JSON | 不做 UI 渲染 |
| `export.js` | 生成清理文本（删 filler、换 weak）、复制 / 下载 TXT / 导出 JSON | 纯函数式 |
| `settings.js` | 语言 / 字号 / 词库 URL 持久化 | 不渲染控件 |
| `visualizer.js` | Canvas 音量条 | 仅录音时运行 |

**分工明确的好处**：每个模块都能单独在浏览器里自测，避免改一处崩一片。

---

## 编码约定

### 通用

- 默认中文交流；代码、变量名、文件名用英文（UTF-8）。
- 简洁优先：不做过度的抽象、不为一次性代码造框架。
- 改完主动跑浏览器验证；不能验证时明确说明原因。
- 密钥 / token / 密码**不进代码、不进 commit、不进日志**。
- 不动没坏的代码；不做顺手重构。

### 浏览器 API

- `SpeechRecognition` 要同时兼容带前缀版本：`window.SpeechRecognition || window.webkitSpeechRecognition`
- 检测失败时显式提示用户「请使用桌面 Chrome / Edge」，**不要静默失败**
- 长录音断连：`onend` 里自动重启 + 重启计数器防死循环

### 标注引擎（核心业务）

- weak 正则**启动时编译一次**复用，不要每次匹配重新创建
- weak 优先级高于 filler，避免嵌套冲突
- 导出清理文本：filler 整词删除（合并前后空格）；weak 替换为 `suggestions[0]`

### 词库

- `filler.json`：字符串数组
- `weak.json`：`{ "pattern", "suggestions": [], "reason"? }` 对象数组
- 外部 URL 失败 → 静默回退内置 + `console.warn`，**不影响使用**

---

## git 协作要点（跨电脑同步这块）

- 默认分支 `main`，收工前 push，开工前 pull
- commit 前缀：`init:` / `feat:` / `fix:` / `refactor:` / `docs:` / `chore:`，中文具体描述
- 每次完成开发 / 修复 / 重要调研后同步更新 `ROADMAP.md`；发版追加 `CHANGELOG.md`
- 纯查询不更新 ROADMAP

---

## 红线（必须问人才能动）

- 删除文件 / 目录 / git 回滚
- 改 `.env` / 密钥 / token / CI/CD 配置
- 数据库 schema / 数据迁移
- 装新的全局依赖 / 改系统配置
- **公开发布**（含 npm publish、生产部署、发文章、开源 LICENSE 定稿）

---

## 验收参考

端到端验证清单见 `ROADMAP.md` 待办。关键条目：

1. 非 Chrome/Edge → 引导提示
2. 录音 → 实时字幕
3. filler → 红 + 删
4. weak → 蓝 + 删 + 建议
5. 导出清理文本正确（删 filler / 换 weak）
6. 长录音自动重启
7. 外部 URL 覆盖 / 回退

每完成一个阶段就在浏览器实测，**不允许纯跑通代码而不看字幕效果**。
