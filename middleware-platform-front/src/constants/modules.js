/**
 * 服务端模块注册表（与 middleware-platform-server 下各一级目录一一对应）
 * 所有模块共用 App.jsx 的菜单、项目导航与环境切换，通过 module.code 区分。
 *
 * AUTH 为平台基础设施，不进入产品矩阵，仅提供统一登录 API。
 */
export const AUTH_MODULE = {
  code: 'AUTH',
  name: '统一登录',
  path: '/auth',
  port: 8089,
  serverDir: 'middleware-platform-server-auth',
  inMatrix: false
};

export const MODULES = [
  {
    code: 'CONFIG',
    name: '配置中心',
    path: '/config-center',
    port: 8081,
    serverDir: 'middleware-platform-server-config-center',
    inMatrix: true
  },
  {
    code: 'REGISTRY',
    name: '注册中心',
    path: '/registry-center',
    port: 8086,
    serverDir: 'middleware-platform-server-registry-center',
    inMatrix: true
  },
  {
    code: 'DLB',
    name: '分布式负载均衡',
    path: '/dlb',
    port: 8082,
    serverDir: 'middleware-platform-server-dlb',
    inMatrix: true
  },
  {
    code: 'FLOW',
    name: '流控中心',
    path: '/flow-control-center',
    port: 8083,
    serverDir: 'middleware-platform-server-flow-control-center',
    inMatrix: true
  },
  {
    code: 'GATEWAY',
    name: '网关中心',
    path: '/gateway-center',
    port: 8084,
    serverDir: 'middleware-platform-server-gateway-center',
    inMatrix: true
  },
  {
    code: 'JOB',
    name: '任务调度',
    path: '/job',
    port: 8085,
    serverDir: 'middleware-platform-server-job',
    inMatrix: true
  },
  {
    code: 'MQ',
    name: '消息队列',
    path: '/mq',
    port: 8080,
    serverDir: 'middleware-platform-server-mq',
    inMatrix: true
  },
  {
    code: 'LOG',
    name: '日志平台',
    path: '/log-platform',
    port: 8087,
    serverDir: 'middleware-platform-server-log-platform',
    inMatrix: true
  },
  {
    code: 'TRACE',
    name: '链路追踪',
    path: '/trace',
    port: 8088,
    serverDir: 'middleware-platform-server-trace',
    inMatrix: true
  }
];

export const ENVIRONMENTS = [
  { key: 'dev-cn', label: '开发-国内' },
  { key: 'dev-sg', label: '开发-新加坡' },
  { key: 'test-cn', label: '测试-国内' },
  { key: 'test-sg', label: '测试-新加坡' },
  { key: 'staging-cn', label: '预发-国内' },
  { key: 'staging-sg', label: '预发-新加坡' },
  { key: 'prod-cn', label: '生产-国内' },
  { key: 'prod-sg', label: '生产-新加坡' }
];

export const MATRIX_MODULES = MODULES.filter((m) => m.inMatrix !== false);

export const getModuleByPath = (path) => MODULES.find((m) => m.path === path);

export const getModuleByCode = (code) => {
  if (code === AUTH_MODULE.code) {
    return AUTH_MODULE;
  }
  return MODULES.find((m) => m.code === code);
};
