// lexicon.js — 词库加载（内置 + 外部 URL 覆盖 / 回退）

const BUILTIN_FILLER = 'data/filler.json';
const BUILTIN_WEAK = 'data/weak.json';

async function loadJson(url) {
  // 兼容 file:// 与 http://
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.json();
}

/**
 * @param {{ fillerUrl?: string|null, weakUrl?: string|null }} opts
 * @returns {Promise<{ filler: Set<string>, weak: Array<{pattern: string, suggestions: string[], reason?: string, regex: RegExp}> }>}
 */
export async function loadLexicon(opts = {}) {
  let fillerList = [];
  let weakList = [];

  // 语气词
  try {
    fillerList = opts.fillerUrl
      ? await loadJson(opts.fillerUrl)
      : await loadJson(BUILTIN_FILLER);
  } catch (err) {
    console.warn('[lexicon] 外部 filler 词库失败，回退内置', err);
    fillerList = await loadJson(BUILTIN_FILLER);
  }

  // 弱表达
  try {
    weakList = opts.weakUrl
      ? await loadJson(opts.weakUrl)
      : await loadJson(BUILTIN_WEAK);
  } catch (err) {
    console.warn('[lexicon] 外部 weak 词库失败，回退内置', err);
    weakList = await loadJson(BUILTIN_WEAK);
  }

  return {
    filler: new Set(fillerList),
    weak: weakList.map((item) => ({
      ...item,
      // 启动编译一次正则，标注时复用
      regex: new RegExp(item.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    })),
  };
}
