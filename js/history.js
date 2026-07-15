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

/** 渲染历史列表到 ul 元素 */
export function renderHistory(listEl) {
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
    li.textContent = s.title;
    li.title = new Date(s.createdAt).toLocaleString();
    listEl.appendChild(li);
  });
}

/** 通知历史列表刷新（在新会话保存 / 删除后调用） */
export function refreshHistory(listEl) {
  renderHistory(listEl);
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
