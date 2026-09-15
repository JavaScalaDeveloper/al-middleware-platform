/** 网关集群枚举 */
export const GATEWAY_CLUSTERS = [
  { key: 'APP', label: 'APP', desc: '公网访问' },
  { key: 'Auth', label: 'Auth', desc: '内网访问' },
  { key: 'Internal', label: 'Internal', desc: '内部应用间访问' },
  { key: 'AI', label: 'AI', desc: '支持流式响应' },
  { key: 'Open', label: 'Open', desc: '外部三方访问' }
];

/** 登录态 */
export const LOGIN_STATES = [
  { value: 'USER', label: '用户态' },
  { value: 'GUEST', label: '游客态' }
];

export const DEFAULT_TIMEOUT_SEC = 10;

/** 超时上限（秒）：APP 最多 15 分钟，其余最多 60 秒 */
export const getTimeoutMaxSec = (clusterKey) => (clusterKey === 'APP' ? 15 * 60 : 60);

export const formatTimeout = (sec) => {
  if (sec == null) return '-';
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m}分${s}秒` : `${m}分钟`;
  }
  return `${sec}秒`;
};

const STORAGE_KEY = 'mp_gateway_routes';

const seedRoutes = () => ([
  {
    id: 'r1',
    cluster: 'APP',
    appName: 'user-center',
    apiPath: '/api/user/profile',
    loginState: 'USER',
    enabled: true,
    timeoutSec: 10,
    updatedAt: Date.now()
  },
  {
    id: 'r2',
    cluster: 'APP',
    appName: 'content-api',
    apiPath: '/api/content/public/**',
    loginState: 'GUEST',
    enabled: true,
    timeoutSec: 15,
    updatedAt: Date.now()
  },
  {
    id: 'r3',
    cluster: 'Auth',
    appName: 'iam',
    apiPath: '/api/auth/token',
    loginState: 'GUEST',
    enabled: true,
    timeoutSec: 5,
    updatedAt: Date.now()
  },
  {
    id: 'r4',
    cluster: 'AI',
    appName: 'llm-gateway',
    apiPath: '/api/ai/chat/stream',
    loginState: 'USER',
    enabled: true,
    timeoutSec: 60,
    updatedAt: Date.now()
  },
  {
    id: 'r5',
    cluster: 'Open',
    appName: 'partner-open',
    apiPath: '/open/v1/orders',
    loginState: 'USER',
    enabled: false,
    timeoutSec: 30,
    updatedAt: Date.now()
  },
  {
    id: 'r6',
    cluster: 'Internal',
    appName: 'order-svc',
    apiPath: '/internal/order/sync',
    loginState: 'USER',
    enabled: true,
    timeoutSec: 20,
    updatedAt: Date.now()
  }
]);

export const loadAllRoutes = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedRoutes();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedRoutes();
  }
};

export const saveAllRoutes = (routes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
};

export const loadRoutesByCluster = (clusterKey) =>
  loadAllRoutes().filter((r) => r.cluster === clusterKey);

export const upsertRoute = (route) => {
  const all = loadAllRoutes();
  const idx = all.findIndex((r) => r.id === route.id);
  const next = { ...route, updatedAt: Date.now() };
  if (idx >= 0) {
    all[idx] = next;
  } else {
    all.unshift(next);
  }
  saveAllRoutes(all);
  return next;
};

export const createRouteId = () => `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** 权限管控：签名白名单 / 鉴权白名单 */
const PERMISSION_KEY = 'mp_gateway_permission_whitelists';

const seedPermissions = () => ({
  /** 签名白名单：命中后请求需对 path + 参数计算签名（反爬） */
  signature: [
    {
      id: 's1',
      cluster: 'APP',
      appName: 'content-api',
      apiPath: '/api/content/public/**',
      enabled: true,
      remark: '公网内容接口防爬',
      updatedAt: Date.now()
    },
    {
      id: 's2',
      cluster: 'Open',
      appName: 'partner-open',
      apiPath: '/open/v1/orders',
      enabled: true,
      remark: '三方下单接口',
      updatedAt: Date.now()
    }
  ],
  /** 鉴权白名单：命中后请求必须通过统一鉴权（登录态 / Token） */
  auth: [
    {
      id: 'a1',
      cluster: 'APP',
      appName: 'user-center',
      apiPath: '/api/user/profile',
      enabled: true,
      remark: '用户资料需登录',
      updatedAt: Date.now()
    },
    {
      id: 'a2',
      cluster: 'AI',
      appName: 'llm-gateway',
      apiPath: '/api/ai/chat/stream',
      enabled: true,
      remark: 'AI 流式对话需鉴权',
      updatedAt: Date.now()
    }
  ]
});

export const loadPermissions = () => {
  try {
    const raw = localStorage.getItem(PERMISSION_KEY);
    if (!raw) {
      const seed = seedPermissions();
      localStorage.setItem(PERMISSION_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedPermissions();
  }
};

export const savePermissions = (data) => {
  localStorage.setItem(PERMISSION_KEY, JSON.stringify(data));
};

export const loadPermissionList = (type, clusterKey) => {
  const all = loadPermissions();
  const list = all[type] || [];
  return list.filter((item) => item.cluster === clusterKey);
};

export const upsertPermissionItem = (type, item) => {
  const all = loadPermissions();
  const list = all[type] || [];
  const idx = list.findIndex((x) => x.id === item.id);
  const next = { ...item, updatedAt: Date.now() };
  if (idx >= 0) {
    list[idx] = next;
  } else {
    list.unshift(next);
  }
  all[type] = list;
  savePermissions(all);
  return next;
};

export const removePermissionItem = (type, id) => {
  const all = loadPermissions();
  all[type] = (all[type] || []).filter((x) => x.id !== id);
  savePermissions(all);
};

export const createPermissionId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
