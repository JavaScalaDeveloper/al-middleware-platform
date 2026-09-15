import React from 'react';
import { Layout, Menu, Button, Drawer, Card, Carousel, Row, Col, Dropdown, Space, Form, Input, message, Spin } from 'antd';
import { AppstoreOutlined, SettingOutlined, CloudServerOutlined, SwapOutlined, ControlOutlined, GatewayOutlined, ScheduleOutlined, MessageOutlined, FileSearchOutlined, BranchesOutlined, UserOutlined, LogoutOutlined, LockOutlined } from '@ant-design/icons';
import { MATRIX_MODULES, ENVIRONMENTS, getModuleByPath } from './constants/modules';
import { login, logout, fetchCurrentUser, getStoredUser, getRoleLabel } from './api/auth';
import GatewayCenter from './pages/gateway/GatewayCenter';
import ConfigCenter from './pages/config/ConfigCenter';
import './App.css';

const { Header, Content } = Layout;

const MODULE_ICONS = {
  CONFIG: <SettingOutlined />,
  REGISTRY: <CloudServerOutlined />,
  DLB: <SwapOutlined />,
  FLOW: <ControlOutlined />,
  GATEWAY: <GatewayOutlined />,
  JOB: <ScheduleOutlined />,
  MQ: <MessageOutlined />,
  LOG: <FileSearchOutlined />,
  TRACE: <BranchesOutlined />
};

const products = MATRIX_MODULES.map((module) => ({
  ...module,
  icon: MODULE_ICONS[module.code]
}));

const App = () => {
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [currentEnv, setCurrentEnv] = React.useState('开发-国内');
  const [currentPage, setCurrentPage] = React.useState('');
  const [user, setUser] = React.useState(null);
  const [authChecking, setAuthChecking] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  const handleEnvChange = ({ key }) => {
    const env = ENVIRONMENTS.find(e => e.key === key);
    if (env) {
      setCurrentEnv(env.label);
    }
  };

  const navigateToModule = (path) => {
    window.location.hash = path;
    setDrawerVisible(false);
  };

  const handleLogin = async (values) => {
    setLoginLoading(true);
    try {
      const loggedInUser = await login(values.username, values.password);
      setUser(loggedInUser);
      message.success(`欢迎，${loggedInUser.displayName}`);
    } catch (e) {
      message.error(e.message || '登录失败');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDrawerVisible(false);
    window.location.hash = '';
    message.success('已退出登录');
  };

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = getStoredUser();
      if (cached) {
        setUser(cached);
      }
      const current = await fetchCurrentUser();
      if (!cancelled) {
        setUser(current);
        setAuthChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const carouselImages = [
    '/images/carousel1.jpg',
    '/images/carousel2.jpg',
    '/images/carousel3.jpg'
  ];

  const renderLoginPage = () => (
    <Content className="content login-content">
      <Card className="login-card" title="中间件管理平台 · 统一登录">
        <p className="login-hint">现阶段仅支持超级管理员登录</p>
        <Form layout="vertical" onFinish={handleLogin} initialValues={{ username: 'admin' }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="admin" autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loginLoading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Content>
  );

  const renderProductPage = () => {
    const product = getModuleByPath(currentPage);
    if (!product) return null;

    if (product.code === 'GATEWAY') {
      return (
        <Content className="module-content">
          <GatewayCenter user={user} onBack={() => { window.location.hash = ''; }} />
        </Content>
      );
    }

    if (product.code === 'CONFIG') {
      return (
        <Content className="module-content">
          <ConfigCenter user={user} onBack={() => { window.location.hash = ''; }} />
        </Content>
      );
    }

    return (
      <Content className="content">
        <div className="product-page">
          <h2>{product.name}模块</h2>
          <p>这里是{product.name}模块的详细内容页面。</p>
          <p>模块代码: {product.code}</p>
          <p>模块端口: {product.port}</p>
          <p>当前操作人: {user.displayName}（{user.username}）</p>
          <p>权限角色: {getRoleLabel(user.role)}</p>
          <Button onClick={() => window.location.hash = ''}>返回首页</Button>
        </div>
      </Content>
    );
  };

  if (authChecking) {
    return (
      <div className="auth-loading">
        <Spin size="large" tip="正在校验登录态..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Layout className="layout">
        <Header className="header">
          <div className="logo">
            <span className="logo-text">中间件管理平台</span>
          </div>
          <div className="header-right">
            <span className="title">请登录</span>
          </div>
        </Header>
        {renderLoginPage()}
      </Layout>
    );
  }

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="logo">
          <span className="logo-text">中间件管理平台</span>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>全部</span>
                </Space>
              ),
              onClick: showDrawer
            }
          ]}
          className="menu"
        />
        <div className="header-right">
          <span className="title">中间件管理平台</span>
          <Dropdown
            menu={{
              items: ENVIRONMENTS,
              onClick: handleEnvChange
            }}
            trigger={['click']}
          >
            <Button type="link" className="env-button">
              {currentEnv} ▼
            </Button>
          </Dropdown>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  label: `${user.displayName} · ${getRoleLabel(user.role)}`,
                  disabled: true
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout
                }
              ]
            }}
            trigger={['click']}
          >
            <Button type="link" className="env-button user-button">
              <UserOutlined /> {user.displayName} ▼
            </Button>
          </Dropdown>
        </div>
      </Header>

      {currentPage ? (
        renderProductPage()
      ) : (
        <Content className="content">
          <div className="carousel-container">
            <Carousel autoplay>
              {carouselImages.map((image, index) => (
                <div key={index} className="carousel-slide">
                  <img src={image} alt={`slide-${index}`} />
                </div>
              ))}
            </Carousel>
          </div>

          <div className="product-matrix">
            <h2 className="product-matrix-title">产品矩阵</h2>
            <Row gutter={[24, 24]}>
              {products.map(product => (
                <Col span={6} key={product.code}>
                  <Card
                    title={<span><span className="product-icon">{product.icon}</span> {product.name}</span>}
                    className="product-card"
                    onClick={() => navigateToModule(product.path)}
                  >
                    <p>{product.name}模块</p>
                    <p className="module-code">代码: {product.code}</p>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Content>
      )}

      <Drawer
        title="项目导航"
        placement="left"
        closable={true}
        onClose={onClose}
        open={drawerVisible}
        width={400}
      >
        <div className="drawer-content">
          <h3>最近访问</h3>
          <Row gutter={[16, 16]}>
            {products.slice(0, 4).map(product => (
              <Col span={12} key={`recent-${product.code}`}>
                <Card
                  size="small"
                  title={<span><span className="product-icon">{product.icon}</span> {product.name}</span>}
                  className="drawer-card"
                  onClick={() => navigateToModule(product.path)}
                >
                  <p>{product.name}模块</p>
                  <p className="module-code">代码: {product.code}</p>
                </Card>
              </Col>
            ))}
          </Row>

          <h3>所有项目</h3>
          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col span={12} key={`all-${product.code}`}>
                <Card
                  size="small"
                  title={<span><span className="product-icon">{product.icon}</span> {product.name}</span>}
                  className="drawer-card"
                  onClick={() => navigateToModule(product.path)}
                >
                  <p>{product.name}模块</p>
                  <p className="module-code">代码: {product.code}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Drawer>
    </Layout>
  );
};

export default App;
