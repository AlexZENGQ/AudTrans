// app.js — 入口：装配 ASR / annotator / history，不写具体业务算法

import { detectCompat, showCompatHint, ASRController } from './asr.js';
import { loadLexicon } from './lexicon.js';
import { annotate, extractCleanText } from './annotator.js';
import { saveSession } from './history.js';

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

/* ---------- 二次确认弹层 ---------- */
function showConfirm({ title, text, okLabel = '确认', okDanger = true }) {
  return new Promise((resolve) => {
    const modal = $('confirmModal');
    const titleEl = $('confirmTitle');
    const textEl = $('confirmText');
    const okBtn = $('confirmOk');
    const cancelBtn = $('confirmCancel');

    titleEl.textContent = title;
    textEl.textContent = text;
    okBtn.textContent = okLabel;
    okBtn.className = okDanger ? 'btn btn--danger' : 'btn btn--primary';
    modal.classList.remove('modal--hidden');

    const close = (result) => {
      modal.classList.add('modal--hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBg);
      resolve(result);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    const onBg = (e) => { if (e.target === modal) close(false); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBg);
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
    };
  }

  get sessionData() { return this.session; }

  updateInterim(text) {
    if (!this.current) {
      const p = document.createElement('p');
      p.className = 'caption__line caption__line--interim';
      this.caption.appendChild(p);
      this.current = { el: p, text };
    }
    this.current.text = text;
    this.current.el.textContent = '';
    this.current.el.appendChild(annotate(text, lexicon));
    this.caption.scrollTop = this.caption.scrollHeight;
  }

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

  finalize() {
    if (this.current) {
      this.current.el.className = 'caption__line caption__line--final';
      this.current = null;
    }
  }
}

function buildCleanText(session) {
  if (!session) return '';
  return session.entries.map((e) => e.clean).join('');
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

  // 3) 加载词库
  const params = new URLSearchParams(location.search);
  lexicon = await loadLexicon({
    fillerUrl: params.get('fillerUrl'),
    weakUrl: params.get('weakUrl'),
  });

  // 4) 字号调节
  const caption = $('caption');
  const range = $('fontSizeRange');
  caption.style.fontSize = `${range.value}px`;
  range.addEventListener('input', () => { caption.style.fontSize = `${range.value}px`; });

  // 5) 字幕流
  const flow = new SubtitleFlow(caption);

  // 6) 装配 ASR
  const asr = new ASRController({
    lang: $('langSelect').value,
    onStart: () => {
      flow.reset(asr.lang);
      $('stopBtn').disabled = false;
      $('startBtn').disabled = true;
    },
    onInterim: (text) => flow.updateInterim(text),
    onFinal: (text) => flow.commitFinal(text),
    onEnd: () => {
      flow.finalize();
      const s = flow.sessionData;
      if (s && s.entries.length) saveSession(s);
      $('stopBtn').disabled = true;
      $('startBtn').disabled = false;
      $('exportBar').classList.remove('export-bar--hidden');
    },
    onError: (msg) => console.error('[asr]', msg),
  });

  // 7) 启停按钮（停止增加二次确认）
  $('startBtn').addEventListener('click', () => asr.start());
  $('stopBtn').addEventListener('click', async () => {
    const ok = await showConfirm({
      title: '结束录音？',
      text: '点击「确认」会结束当前录音并保存会话；取消则继续录音。',
      okLabel: '确认结束',
    });
    if (ok) asr.stop();
  });

  // 8) 导出
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
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

boot().catch((err) => console.error('[AudTrans] 启动失败', err));
