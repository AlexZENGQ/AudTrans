// app.js — 入口：装配 ASR / annotator / history，不写具体业务算法

import { detectCompat, showCompatHint, ASRController } from './asr.js';
import { loadLexicon } from './lexicon.js';
import { annotate, extractCleanText } from './annotator.js';
import { saveSession, deleteSession, renderHistory, replaySession } from './history.js';
import { getSettings, setSettings, applyStartup } from './settings.js';

const $ = (id) => document.getElementById(id);
const THEME_KEY = 'audtrans.theme';

let lexicon = null;

/* ---------- 主题切换 ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}
function bindThemeSelect() {
  const sel = $('themeSelect');
  if (!sel) return;
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) sel.value = saved;
  applyTheme(sel.value);
  sel.addEventListener('change', () => {
    applyTheme(sel.value);
    localStorage.setItem(THEME_KEY, sel.value);
  });
}

/* ---------- 二次确认弹层（带兜底：30s 超时 / Esc / 异常降级原生 confirm） ---------- */
function showConfirm({ title, text, okLabel = '确认', okDanger = true }) {
  return new Promise((resolve) => {
    const modal = $('confirmModal');
    if (!modal) {
      // 完全降级
      resolve(window.confirm(`${title}\n${text}`));
      return;
    }
    const titleEl = $('confirmTitle');
    const textEl = $('confirmText');
    const okBtn = $('confirmOk');
    const cancelBtn = $('confirmCancel');

    // 任何关键元素缺失 → 降级原生 confirm
    if (!titleEl || !textEl || !okBtn || !cancelBtn) {
      console.error('[showConfirm] DOM 缺失，降级原生 confirm');
      resolve(window.confirm(`${title}\n${text}`));
      return;
    }

    let settled = false;
    const close = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener('keydown', onEsc);
      modal.classList.add('modal--hidden');
      resolve(result);
    };

    const onOk = () => close(true);
    const onCancel = () => close(false);
    const onBg = (e) => { if (e.target === modal) close(false); };
    const onEsc = (e) => { if (e.key === 'Escape') close(false); };

    titleEl.textContent = title;
    textEl.textContent = text;
    okBtn.textContent = okLabel;
    okBtn.className = okDanger ? 'btn btn--danger' : 'btn btn--primary';
    modal.classList.remove('modal--hidden');

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBg);
    window.addEventListener('keydown', onEsc);

    // 30s 超时兜底（防 Promise 永远 pending）
    const timer = setTimeout(() => {
      console.warn('[showConfirm] 30s 超时自动关闭');
      close(false);
    }, 30000);
  });
}

/* ---------- 字幕流 ---------- */
class SubtitleFlow {
  constructor(captionEl) {
    this.caption = captionEl;
    this.current = null;
    this.session = null;
  }

  reset(lang) {
    this.caption.innerHTML = '';
    this.current = null;
    this.session = {
      id: `sess_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
      title: `${new Date().toLocaleString()} 会话`,
      lang,
      createdAt: Date.now(),
      entries: [],
      recordedMs: 0,
    };
  }

  get sessionData() { return this.session; }

  /**
   * interim：只显示纯文本（灰），不跑 annotate —— 大幅降低延迟。
   * annotate 只在 final 阶段调用一次。
   */
  updateInterim(text) {
    if (!this.current) {
      const p = document.createElement('p');
      p.className = 'caption__line caption__line--interim';
      this.caption.appendChild(p);
      this.current = { el: p, text };
    }
    this.current.text = text;
    this.current.el.textContent = text; // 纯文本，不标注
    this.caption.scrollTop = this.caption.scrollHeight;
  }

  /** final：锁定当前 utterance → 用 annotate 标注 → 加入 entries */
  commitFinal(text) {
    const p = this.current ? this.current.el : document.createElement('p');
    p.className = 'caption__line caption__line--final';
    p.textContent = '';
    p.appendChild(annotate(text, lexicon));
    if (!this.current) this.caption.appendChild(p);
    if (this.session) {
      this.session.entries.push({
        id: `e_${this.session.entries.length + 1}`,
        text,
        clean: extractCleanText(p),
        final: true,
        createdAt: Date.now(),
      });
    }
    this.current = null;
    this.caption.scrollTop = this.caption.scrollHeight;
  }

  /**
   * 录音结束：若仍有未锁定的 interim，强制写成 final entry
   * → 解决"短促录音没有 final、历史不显示"的问题
   */
  finalize() {
    if (this.current && this.current.text && this.session) {
      this.session.entries.push({
        id: `e_${this.session.entries.length + 1}`,
        text: this.current.text,
        clean: this.current.text,
        final: false,
        createdAt: Date.now(),
      });
      this.current.el.className = 'caption__line caption__line--final';
    }
    this.current = null;
  }
}

function buildCleanText(session) {
  if (!session) return '';
  return session.entries.map((e) => e.clean).join('');
}

/* ---------- 录音计时器 ---------- */
function createTimer() {
  const el = $('recTimer');
  let startedAt = 0;
  let tickHandle = null;

  function fmt(ms) {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function render() {
    if (!startedAt) {
      el.textContent = '00:00';
      return;
    }
    el.textContent = fmt(Date.now() - startedAt);
  }

  return {
    start() {
      startedAt = Date.now();
      el.classList.add('rec-timer--active');
      render();
      tickHandle = setInterval(render, 1000);
    },
    stop() {
      startedAt = 0;
      el.classList.remove('rec-timer--active');
      if (tickHandle) clearInterval(tickHandle);
      tickHandle = null;
      render();
    },
    currentMs() {
      return startedAt ? Date.now() - startedAt : 0;
    },
  };
}

/* ---------- 装配 ---------- */
async function boot() {
  // 1) 浏览器兼容检测
  const compat = detectCompat();
  if (!compat.supported) {
    showCompatHint($('compatHint'), compat.message);
    $('startBtn').disabled = true;
    return;
  }

  // 2) 主题
  bindThemeSelect();

  // 3) 先拿 DOM 引用
  const caption = $('caption');
  const range = $('fontSizeRange');

  // 4) 字号 / 语言设置持久化启动应用
  applyStartup({ fontSizeRange: range, langSelect: $('langSelect') });

  // 5) 字号调节 + 持久化
  range.addEventListener('input', () => {
    caption.style.fontSize = `${range.value}px`;
    setSettings({ fontSize: Number(range.value) });
  });

  // 6) 加载词库
  const params = new URLSearchParams(location.search);
  lexicon = await loadLexicon({
    fillerUrl: params.get('fillerUrl'),
    weakUrl: params.get('weakUrl'),
  });

  // 7) 字幕流
  const flow = new SubtitleFlow(caption);

  // 8) 计时器
  const timer = createTimer();

  // 9) 装配 ASR
  const asr = new ASRController({
    lang: $('langSelect').value,
    onStart: () => {
      flow.reset(asr.lang);
      $('stopBtn').disabled = false;
      $('startBtn').disabled = true;
      timer.start();
    },
    onInterim: (text) => flow.updateInterim(text),
    onFinal: (text) => flow.commitFinal(text),
    onEnd: () => {
      flow.finalize();
      const s = flow.sessionData;
      if (s) {
        s.recordedMs = timer.currentMs();
        if (s.entries.length) saveSession(s);
      }
      $('stopBtn').disabled = true;
      $('startBtn').disabled = false;
      $('exportBar').classList.remove('export-bar--hidden');
      timer.stop();
      refreshSidebar();
    },
    onError: (msg) => console.error('[asr]', msg),
  });

  // 10) 语言切换持久化
  $('langSelect').addEventListener('change', () => {
    const lang = $('langSelect').value;
    setSettings({ lang });
    asr.setLang?.(lang);
  });

  // 11) 启停按钮（停止增加二次确认）
  $('startBtn').addEventListener('click', () => asr.start());
  $('stopBtn').addEventListener('click', async () => {
    let ok = false;
    try {
      ok = await showConfirm({
        title: '结束录音？',
        text: '点击「确认」会结束当前录音并保存会话；取消则继续录音。',
        okLabel: '确认结束',
      });
    } catch (err) {
      console.error('[showConfirm] 异常，降级强制停止', err);
      ok = true;
    }
    if (ok) asr.stop();
  });

  // 12) 导出
  $('copyCleanBtn').addEventListener('click', () => {
    const t = buildCleanText(flow.sessionData);
    navigator.clipboard?.writeText(t).then(
      () => alert('已复制清理文本'),
      () => alert('复制失败，请手动选择文本复制'),
    );
  });
  $('downloadTxtBtn').addEventListener('click', () => {
    const t = buildCleanText(flow.sessionData);
    triggerDownload(new Blob([t], { type: 'text/plain;charset=utf-8' }), `${flow.sessionData?.id || 'audtrans'}.txt`);
  });
  $('downloadJsonBtn').addEventListener('click', () => {
    const s = flow.sessionData;
    if (!s) return;
    triggerDownload(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), `${s.id}.json`);
  });

  /* ---------- 历史侧栏 ---------- */
  function refreshSidebar() {
    renderHistory($('historyList'), {
      onSelect: (s) => replaySession($('caption'), s, lexicon, annotate),
      onDelete: async (s) => {
        const ok = await showConfirm({
          title: '删除该会话？',
          text: `「${s.title}」将被永久删除，不可恢复。`,
          okLabel: '删除',
        });
        if (!ok) return;
        deleteSession(s.id);
        refreshSidebar();
      },
    });
  }

  // 启动时渲染一次历史
  refreshSidebar();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

boot().catch((err) => console.error('[AudTrans] 启动失败', err));
