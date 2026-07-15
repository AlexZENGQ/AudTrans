// asr.js — Web Speech API 封装
// 提供兼容检测结果；启停 / 事件 / 自动重启由下阶段完整实现

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
