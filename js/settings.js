// settings.js —— 字号 / 语言 / 主题 持久化
// 主题切换已嵌入 app.js；本文件提供通用 get/set 接口和默认值

const KEY = 'audtrans.settings.v1';

export const DEFAULTS = {
  fontSize: 32,
  lang: 'zh-CN',
  theme: 'dark',
};

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[settings] 读取失败，使用默认值', err);
    return {};
  }
}

function writeAll(obj) {
  localStorage.setItem(KEY, JSON.stringify(obj));
}

export function getSettings() {
  return { ...DEFAULTS, ...readAll() };
}

/** 合并写入（只更新传入字段） */
export function setSettings(patch) {
  const next = { ...readAll(), ...patch };
  writeAll(next);
  return next;
}

/** 启动时一次性应用：字号、语言、主题（主题已在 app.js 处理，这里只管字号/语言控件） */
export function applyStartup({ fontSizeRange, langSelect, onTheme }) {
  const s = getSettings();
  if (fontSizeRange) {
    fontSizeRange.value = s.fontSize;
    document.getElementById('caption').style.fontSize = `${s.fontSize}px`;
  }
  if (langSelect) langSelect.value = s.lang;
  return s;
}
