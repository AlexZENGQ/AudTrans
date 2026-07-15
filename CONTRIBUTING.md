# 贡献指南（CONTRIBUTING）

AudTrans 是一个开源的网页版实时字幕工具。本约定**既给外部贡献者，也给你自己在家里 / 公司两台电脑之间协作时遵循**——git 是同步机制，规范是协同语言。

---

## 开发环境

- **运行时**：浏览器内置 Web Speech API。推荐 **桌面 Chrome / Edge** 开发与自测。
- **静态服务器**（推荐起一个，避免 `file://` 限制）：

  ```bash
  python3 -m http.server 8000
  # 访问 http://localhost:8000
  ```

- **无构建**：纯 HTML / CSS / JS，无需 Node.js、无需 `npm install`。
- **OS**：Windows / Mac 均可（浏览器打开一样）。

---

## 项目结构约定

```
AudTrans/
├── index.html              入口页面
├── styles/                 样式（main.css 全局、markers.css 标注）
├── js/                     业务模块（app.js 入口、asr/annotator/lexicon/history/export/settings/visualizer）
├── data/                   内置词库（filler.json / weak.json）
├── sessions/               会话示例或本地缓存（git 仅留 .gitkeep）
├── docs/                   CHANGELOG.md、DESIGN.md
├── README.md、ROADMAP.md、CONTRIBUTING.md、CLAUDE.md、LICENSE、.gitgitignore
└── page.png                UI 参考原型
```

模块职责以 `CLAUDE.md` 为准；这里只说改代码时**必须遵守的协作约定**。

---

## 分支策略

- **`main`**：日常开发。MVP 阶段直接在上面迭代即可（保持可运行）。
- **`release`**：只合并**稳定、已自测**的版本，用于对外发版。
- **功能分支（可选）**：较大的功能可在 `feat/xxx`、`fix/xxx` 分支上做，完成后合回 `main`。

> 家里 / 公司电脑之间以 `main` 为主同步线。每次开工先 `git pull`，收工前 `git push`。

---

## commit 规范

**语言**：中文描述。

**前缀**（必选一个）：

| 前缀 | 用途 |
|---|---|
| `feat:` | 新功能 |
| `fix:` | 修 bug |
| `refactor:` | 重构（不影响外部行为） |
| `docs:` | 文档 |
| `style:` | 代码格式 / 注释（不影响行为） |
| `chore:` | 构建、依赖、工具、杂务 |
| `init:` | 初始化 |

**描述必须具体**，禁止「修复 bug」「优化代码」这类泛词。范例如下：

- ✅ `feat: asr 模块支持长录音超时自动重启并保留累积 transcript`
- ✅ `fix: 导出清理文本时连续 filler 删除后多余空格未合并`
- ❌ `fix: 修复 bug`
- ❌ `优化代码`

> 不加 `Co-Authored-By`。

---

## 提交前自检

- [ ] 每行改动能追溯到需求 / issue。
- [ ] 没偷偷加功能、重构或格式美化。
- [ ] 浏览器实测过（不能只跑通代码不看字幕效果）。
- [ ] 没有触碰红线（删除文件 / 改密钥 / 公开发布类操作必须问人）。
- [ ] 密钥 / token / 密码不进代码、不进 commit、不进日志。
- [ ] 历史记录、改动说明已更新到 `ROADMAP.md`（如有项目状态变化）。
- [ ] 重要发版追加 `CHANGELOG.md`。

---

## 如何提改动

1. `git pull` 拉最新
2. 新建分支（可选）或在 `main` 上改
3. 改完自测
4. 按 commit 规范提交
5. `git push`
6. 如触发代码评审 / PR，在 PR 描述里写清：**改了什么、为什么改、如何自测**

---

## 发版流程

1. 自测清单全部打勾
2. 更新 `CHANGELOG.md`（版本号 + 日期 + 改动）
3. 合到 `release` 分支
4. 同步更新 `ROADMAP.md` 中的「已完成 / 最近验证」

---

## 有问题？

- 进度 / 阻塞：看 [ROADMAP.md](./ROADMAP.md)
- 项目规范 / 架构：看 [CLAUDE.md](./CLAUDE.md)
- 设计背景：看 [docs/DESIGN.md](./docs/DESIGN.md)
