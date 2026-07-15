// app.js — 入口：装配 ASR / annotator / history，不写具体业务算法

import { detectCompat, showCompatHint, ASRController } from './asr.js';
import { loadLexicon } from './lexicon.js';
import { annotate, extractCleanText } from './annotator.js';
import { saveSession } from './history.js';

const $ = (id) => document.getElementById(id);

let lexicon = null;

/**
 * 字幕流管理器：
 * - 一句话 = 一个段落。interim 时反复刷新同一 <p>（灰色），
 *   final 时锁定该段（白色）并 push 进 session.entries。
 * 这是 typeless 范式：同一句话在同一视觉位置由灰变白，不反复新建行。
 */
class SubtitleFlow {
  constructor(captionEl) {
    this.caption = captionEl;
    this.current = null;   // 当前正在识别的 utterance { el, text }
    this.session = null;   // 当前会话
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

  /** interim：把当前 utterance 的文本刷新（同一 p 反复 replace） */
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

  /** final：锁定当前 utterance → 白色、加入 entries */
  commitFinal(text) {
    const p = this.current ? this.current.el : document.createElement('p');
    p.className = 'caption__line caption__line--final';
    p.textContent = '';
    p.appendChild(annotate(text, lexicon));
    if (!this.current) this.caption.appendChild(p);
    if (!this.current) {
      // 没 interim 直接进入 final 的情况
    }
    if (this.session) {
      this.session.entries.push({
        id: `e_${this.session.entries.length + 1}`,
        text,
        clean: extractCleanText(p),
        final: true,
        createdAt: Date.now(),
      });
    }
    this.current = null; // 下句话会新建一个 p
    this.caption.scrollTop = this.caption.scrollHeight;
  }

  finalize() {
    // 结束时若还有未锁定的 interim，当作 final 锁定
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

async function boot() {
  // 1) 浏览器兼容检测
  const compat = detectCompat();
  if (!compat.supported) {
    showCompatHint($('compatHint'), compat.message);
    $('startBtn').disabled = true;
    return;
  }

  // 2) 加载词库
  const params = new URLSearchParams(location.search);
  lexicon = await loadLexicon({
    fillerUrl: params.get('fillerUrl'),
    weakUrl: params.get('weakUrl'),
  });

  // 3) 字号调节
  const caption = $('caption');
  const range = $('fontSizeRange');
  caption.style.fontSize = `${range.value}px`;
  range.addEventListener('input', () => { caption.style.fontSize = `${range.value}px`; });

  // 4) 字幕流
  const flow = new SubtitleFlow(caption);

  // 5) 装配 ASR
  const asr = new ASRController({
    lang: $('langSelect').value,
    onStart: () => flow.reset(asr.lang),
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

  // 6) 按钮绑定
  $('startBtn').addEventListener('click', () => asr.start());
  $('stopBtn').addEventListener('click', () => asr.stop());

  // 7) 导出
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
