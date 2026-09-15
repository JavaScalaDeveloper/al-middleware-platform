import { getStoredToken, getStoredUser } from './auth';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const user = getStoredUser();
  if (user?.username) {
    headers['X-Username'] = user.username;
  }
  if (user?.role) {
    headers['X-Role'] = user.role;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  let payload;
  try {
    payload = await response.json();
  } catch (e) {
    throw new Error('配置中心服务异常，请确认 CONFIG 服务已启动（端口 8081）');
  }
  if (!payload.success) {
    throw new Error(payload.message || '请求失败');
  }
  return payload.data;
}

export const listApps = (scope = 'all', keyword = '') => {
  const params = new URLSearchParams({ scope });
  if (keyword) params.set('keyword', keyword);
  return request(`/api/config/apps?${params.toString()}`);
};

export const applyAppPermission = (appId, remark) =>
  request(`/api/config/apps/${appId}/permission/apply`, {
    method: 'POST',
    body: JSON.stringify({ remark: remark || '' })
  });

export const listGroups = (appId) => request(`/api/config/apps/${appId}/groups`);

export const createGroup = (appId, code, name) =>
  request(`/api/config/apps/${appId}/groups`, {
    method: 'POST',
    body: JSON.stringify({ code, name })
  });

export const deleteGroup = (appId, groupId) =>
  request(`/api/config/apps/${appId}/groups/${groupId}`, { method: 'DELETE' });

export const listSets = (appId, groupId) =>
  request(`/api/config/apps/${appId}/groups/${groupId}/sets`);

export const createSet = (appId, groupId, name) =>
  request(`/api/config/apps/${appId}/groups/${groupId}/sets`, {
    method: 'POST',
    body: JSON.stringify({ name })
  });

export const getSet = (setId) => request(`/api/config/sets/${setId}`);

export const renameSet = (setId, name) =>
  request(`/api/config/sets/${setId}`, {
    method: 'PUT',
    body: JSON.stringify({ name })
  });

export const deleteSet = (setId) =>
  request(`/api/config/sets/${setId}`, { method: 'DELETE' });

export const saveSetItems = (setId, items) =>
  request(`/api/config/sets/${setId}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items })
  });

export const saveSetText = (setId, text) =>
  request(`/api/config/sets/${setId}/items`, {
    method: 'PUT',
    body: JSON.stringify({ text })
  });

export const publishSet = (setId) =>
  request(`/api/config/sets/${setId}/publish`, { method: 'POST' });

export const listTickets = () => request('/api/config/tickets');

export const handleTicket = (ticketId, action, remark) =>
  request(`/api/config/tickets/${ticketId}/handle`, {
    method: 'POST',
    body: JSON.stringify({ action, remark })
  });

export const itemsToText = (items = {}) =>
  Object.entries(items)
    .map(([k, v]) => `${k}=${v ?? ''}`)
    .join('\n');

export const textToItemList = (text) => {
  const rows = [];
  String(text || '')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return;
      let idx = trimmed.indexOf('=');
      if (idx < 0) idx = trimmed.indexOf(':');
      if (idx <= 0) return;
      rows.push({
        key: trimmed.slice(0, idx).trim(),
        value: trimmed.slice(idx + 1).trim()
      });
    });
  return rows;
};
