const TOKEN_KEY = 'mp_auth_token';
const USER_KEY = 'mp_auth_user';

const ROLE_LABELS = {
  SUPER_ADMIN: '超级管理员'
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role || '-';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  let payload;
  try {
    payload = await response.json();
  } catch (e) {
    throw new Error('认证服务响应异常，请确认 AUTH 服务已启动（端口 8089）');
  }

  if (!payload.success) {
    throw new Error(payload.message || '请求失败');
  }
  return payload.data;
}

export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const { token, ...user } = data;
  saveSession(token, user);
  return user;
}

export async function fetchCurrentUser() {
  const token = getStoredToken();
  if (!token) {
    return null;
  }
  try {
    const user = await request('/api/auth/me');
    saveSession(token, user);
    return user;
  } catch (e) {
    clearSession();
    return null;
  }
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // 本地清理即可
  } finally {
    clearSession();
  }
}
