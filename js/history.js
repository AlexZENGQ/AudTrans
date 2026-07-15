// history.js — 会话历史：增删、localStorage 持久化、导入导出 JSON
// 暂不上数据库（见 README）

const STORAGE_KEY = 'audtrans.sessions.v1';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[history] 读取失败，重置为空', err);
    return {};
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * @param {{ id:string, title:string, lang:string, createdAt:number, entries: Array }} session
 */
export function saveSession(session) {
  const map = readAll();
  map[session.id] = session;
  writeAll(map);
}

export function deleteSession(id) {
  const map = readAll();
  delete map[id];
  writeAll(map);
}

export function getSession(id) {
  return readAll()[id] || null;
}

export function listSessions() {
  return Object.values(readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

/** 渲染历史列表到 ul 元素，支持点击和删除 callback */
export function renderHistory(listEl, { onSelect, onDelete } = {}) {
  if (!listEl) return;
  const items = listSessions();
  listEl.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'history-empty';
    li.textContent = '暂无历史，开始录音后自动生成。';
    listEl.appendChild(li);
    return;
  }
  items.forEach((s) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const btn = document.createElement('button');
    btn.className = 'history-item__btn';
    const date = new Date(s.createdAt);
    btn.innerHTML = `<span class="history-item__title">${s.title || date.toLocaleString()}</span><span class="history-item__meta">${s.entries.length} 条 · ${date.toLocaleDateString()}</span>`;
    btn.addEventListener('click', () => onSelect?.(s));

    const del = document.createElement('button');
    del.className = 'history-item__del';
    del.title = '删除该会话';
    del.setAttribute('aria-label', '删除该会话');
    del.textContent = '×';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      onDelete?.(s);
    });

    li.appendChild(btn);
    li.appendChild(del);
    listEl.appendChild(li);
  });
}

/** 通知历史列表刷新（在新会话保存 / 删除后调用） */
export function refreshHistory(listEl) {
  renderHistory(listEl);
}

/** 回放单个会话到主字幕区（只读，不清 localStorage）
 * @param {(text:string, lexicon:object)=>DocumentFragment} annotateFn 由调用方注入
 */
export function replaySession(captionEl, session, lexicon, annotateFn) {
  if (!captionEl || !session || !annotateFn) return;
  captionEl.innerHTML = '';
  const hint = document.createElement('p');
  hint.className = 'caption__line caption__hint';
  hint.textContent = `查看历史：${session.title}（${new Date(session.createdAt).toLocaleString()}）`;
  captionEl.appendChild(hint);

  session.entries.forEach((e) => {
    const p = document.createElement('p');
    p.className = 'caption__line caption__line--final';
    p.appendChild(annotateFn(e.text, lexicon));
    captionEl.appendChild(p);
  });
  captionEl.scrollTop = 0;
}

/** 当前会话占位，完整装配在下一阶段 */
export function getCurrentSession() {
  return null;
}

/** 导出单个会话为 JSON 文件 */
export function exportSessionToFile(session) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audtrans-${session.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
