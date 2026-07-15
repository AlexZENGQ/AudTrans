// app.js — 入口模块：装配各子系统，不写具体业务逻辑

import { detectCompat, showCompatHint } from './asr.js';
import { loadLexicon } from './lexicon.js';
import { renderHistory, refreshHistory, getCurrentSession } from './history.js';

const $ = (id) => document.getElementById(id);

async function boot() {
  // 1) 浏览器兼容检测
  const compat = detectCompat();
  if (!compat.supported) {
    showCompatHint($('compatHint'), compat.message);
    $('startBtn').disabled = true;
    return;
  }

  // 2) 加载词库（内置 + 外部 URL）
  const params = new URLSearchParams(location.search);
  const lexicon = await loadLexicon({
    fillerUrl: params.get('fillerUrl'),
    weakUrl: params.get('weakUrl'),
  });
  console.debug('[AudTrans] 词库加载完成', {
    filler: lexicon.filler.size,
    weak: lexicon.weak.length,
  });

  // 3) 渲染历史会话
  renderHistory($('historyList'));

  // 4) 装配控制按钮（asr 模块注册后绑定）
  // TODO: asr 装配、annotator 装配、export 装配 — 下一阶段完成

  // 5) 字号调节
  const caption = $('caption');
  const range = $('fontSizeRange');
  caption.style.fontSize = `${range.value}px`;
  range.addEventListener('input', () => {
    caption.style.fontSize = `${range.value}px`;
  });
}

boot().catch((err) => {
  console.error('[AudTrans] 启动失败', err);
});
