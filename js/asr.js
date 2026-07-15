// asr.js — Web Speech API 封装
//
// 职责：启停 / 流式结果 / 长录音自动重启。不做标注、不做存储。
// 通过回调把结果交给 app.js：onStart / onInterim / onFinal / onEnd / onError

export function detectCompat() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    return {
      supported: false,
      message: '当前浏览器不支持语音识别，请使用桌面 Chrome / Edge。',
    };
  }
  return { supported: true, message: '' };
}

export function showCompatHint(hintEl, message) {
  if (!hintEl) return;
  hintEl.textContent = message;
  hintEl.classList.remove('compat-hint--hidden');
}

export class ASRController {
  /**
   * @param {{
   *   lang?: string,
   *   onStart?: () => void,
   *   onInterim?: (text: string) => void,
   *   onFinal?: (text: string) => void,
   *   onEnd?: () => void,
   *   onError?: (msg: string) => void,
   * }} [opts]
   */
  constructor(opts = {}) {
    this.lang = opts.lang || 'zh-CN';
    this.onStart = opts.onStart || (() => {});
    this.onInterim = opts.onInterim || (() => {});
    this.onFinal = opts.onFinal || (() => {});
    this.onEnd = opts.onEnd || (() => {});
    this.onError = opts.onError || (() => {});

    this.recognition = null;
    this.running = false;
    this.manualStop = false;
    this.restartCount = 0;
    this.maxRestart = 10;
  }

  start() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.onError('当前浏览器不支持语音识别');
      return;
    }
    if (this.running) return;

    const r = new SR();
    r.lang = this.lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onstart = () => {
      this.running = true;
      this.manualStop = false;
      this.restartCount = 0;
      this.onStart();
    };

    r.onerror = (event) => {
      console.warn('[asr] error', event.error);
      // no-speech / aborted 不致命，无需弹用户；其它报一下
      if (!['no-speech', 'aborted', 'service-not-allowed'].includes(event.error)) {
        this.onError(`识别错误：${event.error}`);
      }
    };

    r.onend = () => {
      this.running = false;
      // 非主动停止 → 尝试自动重启（长录音场景）
      if (!this.manualStop && this.restartCount < this.maxRestart) {
        this.restartCount += 1;
        console.debug(`[asr] 自动重启 #${this.restartCount}`);
        try { this.recognition.start(); return; } catch (e) { /* 重启失败走下面的 onEnd */ }
      }
      this.onEnd();
    };

    r.onresult = (event) => {
      // 累积到当前这一段末尾（onresult 只给当前片段）
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) this.onFinal(txt);
        else interim += txt;
      }
      if (interim) this.onInterim(interim);
    };

    this.recognition = r;
    try {
      r.start();
    } catch (err) {
      this.onError(`启动识别失败：${err.message}`);
    }
  }

  /** 主动停止（结束录音） */
  stop() {
    this.manualStop = true;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }
    this.running = false;
  }

  /** 切换识别语言（会重启识别） */
  setLang(lang) {
    const wasRunning = this.running;
    if (wasRunning) this.stop();
    this.lang = lang;
    // 由调用方按需 restart；这里只更新配置
    if (wasRunning) this.start();
  }
}
