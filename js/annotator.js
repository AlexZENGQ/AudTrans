// annotator.js — 标注引擎：filler / weak 匹配 + DOM 包装 + 建议气泡
//
// 边界：
// - 纯展示 + DOM 生成，不碰 ASR、不碰存储
// - weak 优先级高于 filler（先切 weak，再在切片内切 filler），避免嵌套冲突
// - 启动时由调用方注入已编译 regex 的 weak 列表（符合 lexicon.js 的设计）

const FILLER_CLASS = 'mark-filler';
const WEAK_CLASS = 'mark-weak';
const SUGGEST_CLASS = 'weak-sugg';
const REPLACED_CLASS = 'mark-replaced';

/** 普通文本节点 */
const textNode = (str) => document.createTextNode(str);

/**
 * 把一段已经去掉 weak 的纯文本，按 filler 切成节点数组。
 * filler 用 Set 查找，按长度降序尝试，避免短词误匹配。
 */
function markFillers(text, fillerSet) {
  if (!text) return [];
  if (fillerSet.size === 0) return [textNode(text)];

  const tokens = [...fillerSet].sort((a, b) => b.length - a.length);
  const nodes = [];
  let i = 0;
  while (i < text.length) {
    let matched = null;
    for (const tok of tokens) {
      if (text.startsWith(tok, i)) { matched = tok; break; }
    }
    if (matched) {
      const span = document.createElement('span');
      span.textContent = matched;
      span.className = FILLER_CLASS;
      nodes.push(span);
      i += matched.length;
    } else {
      let buf = '';
      while (i < text.length) {
        let hit = false;
        for (const tok of tokens) {
          if (text.startsWith(tok, i)) { hit = true; break; }
        }
        if (hit) break;
        buf += text[i++];
      }
      if (buf) nodes.push(textNode(buf));
    }
  }
  return nodes;
}

/**
 * 对一段文本做完整标注：先按 weak 切 → 在每段内按 filler 切。
 * weak 多模式用单次 /(?:a|b)/ 合并扫描，避免重叠与重复匹配。
 *
 * @param {string} text
 * @param {{filler: Set<string>, weak: Array}} lexicon
 * @returns {DocumentFragment}
 */
export function annotate(text, lexicon) {
  const frag = document.createTextNode('').ownerDocument.createDocumentFragment();
  if (!text) return frag;

  const weak = lexicon.weak || [];
  const compiled = weak
    .filter((w) => w.regex)
    .map((w) => ({ w, re: new RegExp(w.regex.source, w.regex.flags.includes('i') ? 'gi' : 'g') }));

  if (compiled.length === 0) {
    appendWithFillers(frag, text, lexicon.filler);
    return frag;
  }

  // 收集所有 weak 匹配区间，按出现位置排序
  const matches = [];
  for (const { w, re } of compiled) {
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: re.lastIndex, item: w, text: m[0] });
      if (m.index === re.lastIndex) re.lastIndex++; // 防零宽死循环
    }
  }
  matches.sort((a, b) => a.start - b.start);

  // 去重重叠区间（先出现的优先）
  const picked = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      picked.push(m);
      cursor = m.end;
    }
  }

  // 用 picked weak 切片，wm 之间做 filler
  let last = 0;
  for (const m of picked) {
    if (m.start > last) appendWithFillers(frag, text.slice(last, m.start), lexicon.filler);
    frag.appendChild(buildWeakNode(m.item, m.text));
    last = m.end;
  }
  if (last < text.length) appendWithFillers(frag, text.slice(last), lexicon.filler);

  return frag;
}

/** 在 frag 里把一段文本做 filler 标注后追加 */
function appendWithFillers(frag, text, fillerSet) {
  for (const node of markFillers(text, fillerSet)) frag.appendChild(node);
}

/**
 * 构建弱表达节点：
 * <span class="mark-weak" data-pattern="..." data-suggestion="...">原文<span class="weak-sugg">建议</span></span>
 * 接受替换：把整个节点换成「建议词 + replaced 样式」。
 */
function buildWeakNode(item, matchedText) {
  const wrap = document.createElement('span');
  wrap.className = WEAK_CLASS;
  wrap.dataset.pattern = item.pattern;
  wrap.dataset.suggestion = (item.suggestions && item.suggestions[0]) || '';
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('aria-label', `弱表达：${matchedText}，建议：${wrap.dataset.suggestion || '无'}`);

  wrap.appendChild(document.createTextNode(matchedText));

  if (item.suggestions && item.suggestions.length) {
    const sug = document.createElement('span');
    sug.className = SUGGEST_CLASS;
    sug.textContent = item.suggestions[0];
    wrap.appendChild(sug);

    const handler = () => acceptWeak(wrap, item.suggestions[0]);
    wrap.addEventListener('click', handler);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  }
  return wrap;
}

/**
 * 接受替换：把 weak 节点替换为「建议词 + replaced 样式」
 * @param {HTMLSpanElement} node
 * @param {string} replacement
 */
export function acceptWeak(node, replacement) {
  if (!node || !node.parentNode) return;
  const rep = document.createElement('span');
  rep.className = REPLACED_CLASS;
  rep.textContent = replacement;
  node.parentNode.replaceChild(rep, node);
}

/**
 * 从已标注 DOM 中提取清理文本：
 * - filler：整词删除（合并空格、去掉标点前空格）
 * - weak（未被替换的）：替换为 data-suggestion
 * - replaced：取实际显示文本
 */
export function extractCleanText(root) {
  const clones = root.cloneNode(true);
  clones.querySelectorAll(`.${REPLACED_CLASS}`).forEach((n) =>
    n.replaceWith(document.createTextNode(n.textContent)),
  );
  clones.querySelectorAll(`.${WEAK_CLASS}`).forEach((n) => {
    const sug = n.dataset.suggestion || n.dataset.pattern || '';
    n.replaceWith(document.createTextNode(sug));
  });
  clones.querySelectorAll(`.${FILLER_CLASS}`).forEach((n) => n.remove());

  return clones.textContent
    .replace(/\s+/g, ' ')
    .replace(/\s+([，。！？、；：])/g, '$1')
    .trim();
}
