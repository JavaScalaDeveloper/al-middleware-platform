import React from 'react';
import {
  Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch,
  Table, Tabs, Tag, Tooltip, Typography, message
} from 'antd';
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import {
  GATEWAY_CLUSTERS,
  LOGIN_STATES,
  DEFAULT_TIMEOUT_SEC,
  getTimeoutMaxSec,
  formatTimeout,
  loadRoutesByCluster,
  upsertRoute,
  createRouteId,
  loadPermissionList,
  upsertPermissionItem,
  removePermissionItem,
  createPermissionId
} from './gatewayStore';
import './GatewayCenter.css';

const { Text, Paragraph, Title } = Typography;

const PreciseRouteTab = ({ cluster, routes, onRefresh, operator }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({
      appName: '',
      apiPath: '',
      loginState: 'USER',
      enabled: true,
      timeoutSec: DEFAULT_TIMEOUT_SEC
    });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      appName: record.appName,
      apiPath: record.apiPath,
      loginState: record.loginState,
      enabled: record.enabled,
      timeoutSec: record.timeoutSec
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const maxSec = getTimeoutMaxSec(cluster);
    if (values.timeoutSec > maxSec) {
      message.error(`当前集群超时上限为 ${formatTimeout(maxSec)}`);
      return;
    }

    const duplicated = routes.some(
      (r) =>
        r.appName === values.appName &&
        r.apiPath === values.apiPath &&
        r.id !== editing?.id
    );
    if (duplicated) {
      message.error('同一应用下已存在相同 API 路径');
      return;
    }

    upsertRoute({
      id: editing?.id || createRouteId(),
      cluster,
      appName: values.appName.trim(),
      apiPath: values.apiPath.trim(),
      loginState: values.loginState,
      enabled: values.enabled,
      timeoutSec: values.timeoutSec ?? DEFAULT_TIMEOUT_SEC,
      operator: operator?.username
    });
    message.success(editing ? '路由已更新' : '路由已添加');
    setModalOpen(false);
    onRefresh();
  };

  const toggleEnabled = (record, enabled) => {
    upsertRoute({ ...record, enabled, operator: operator?.username });
    message.success(enabled ? '已启用' : '已停用');
    onRefresh();
  };

  const columns = [
    { title: '应用', dataIndex: 'appName', key: 'appName', width: 160 },
    { title: 'API 路径', dataIndex: 'apiPath', key: 'apiPath' },
    {
      title: '登录态',
      dataIndex: 'loginState',
      key: 'loginState',
      width: 100,
      render: (v) => {
        const item = LOGIN_STATES.find((x) => x.value === v);
        return <Tag color={v === 'USER' ? 'blue' : 'default'}>{item?.label || v}</Tag>;
      }
    },
    {
      title: '超时',
      dataIndex: 'timeoutSec',
      key: 'timeoutSec',
      width: 100,
      render: (v) => formatTimeout(v)
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => toggleEnabled(record, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          修改
        </Button>
      )
    }
  ];

  return (
    <>
      <div className="gateway-toolbar">
        <Text type="secondary">配置应用、API 路径与登录态，支持启用/停用</Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加路由
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={routes}
        pagination={{ pageSize: 8 }}
        size="middle"
      />
      <Modal
        title={editing ? '修改精准路由' : '添加精准路由'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="appName"
            label="应用"
            rules={[
              { required: true, message: '请输入应用名' },
              { pattern: /^[a-zA-Z0-9._-]+$/, message: '仅支持字母数字及 ._- ' }
            ]}
          >
            <Input placeholder="如 user-center" />
          </Form.Item>
          <Form.Item
            name="apiPath"
            label="API 路径"
            rules={[
              { required: true, message: '请输入 API 路径' },
              { pattern: /^\//, message: '路径需以 / 开头' }
            ]}
          >
            <Input placeholder="如 /api/user/profile 或 /api/content/**" />
          </Form.Item>
          <Form.Item
            name="loginState"
            label="登录态"
            rules={[{ required: true, message: '请选择登录态' }]}
          >
            <Select
              options={LOGIN_STATES.map((x) => ({ value: x.value, label: x.label }))}
            />
          </Form.Item>
          <Form.Item
            name="timeoutSec"
            label={`超时时间（秒，上限 ${formatTimeout(getTimeoutMaxSec(cluster))}）`}
            rules={[{ required: true, message: '请设置超时时间' }]}
          >
            <InputNumber
              min={1}
              max={getTimeoutMaxSec(cluster)}
              style={{ width: '100%' }}
              addonAfter="秒"
            />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const TimeoutTab = ({ cluster, routes, onRefresh, operator }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const maxSec = getTimeoutMaxSec(cluster);

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({ timeoutSec: record.timeoutSec });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.timeoutSec > maxSec) {
      message.error(`当前集群超时上限为 ${formatTimeout(maxSec)}`);
      return;
    }
    upsertRoute({
      ...editing,
      timeoutSec: values.timeoutSec,
      operator: operator?.username
    });
    message.success('超时时间已更新');
    setModalOpen(false);
    onRefresh();
  };

  const columns = [
    { title: '应用', dataIndex: 'appName', key: 'appName', width: 160 },
    { title: 'API 路径', dataIndex: 'apiPath', key: 'apiPath' },
    {
      title: '登录态',
      dataIndex: 'loginState',
      key: 'loginState',
      width: 100,
      render: (v) => {
        const item = LOGIN_STATES.find((x) => x.value === v);
        return item?.label || v;
      }
    },
    {
      title: '当前超时',
      dataIndex: 'timeoutSec',
      key: 'timeoutSec',
      width: 120,
      render: (v) => formatTimeout(v)
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (v) => (v ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
          修改超时
        </Button>
      )
    }
  ];

  return (
    <>
      <div className="gateway-toolbar">
        <Space>
          <Text type="secondary">仅可调整已配置路由的超时时间</Text>
          <Tooltip title={`本集群上限：${formatTimeout(maxSec)}（非 APP 集群最多 60 秒，APP 最多 15 分钟）`}>
            <Tag color="orange">
              上限 {formatTimeout(maxSec)} <QuestionCircleOutlined />
            </Tag>
          </Tooltip>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={routes}
        pagination={{ pageSize: 8 }}
        size="middle"
        locale={{ emptyText: '当前集群暂无已配置路由，请先在「精准路由」中添加' }}
      />
      <Modal
        title={`修改超时 · ${editing?.appName || ''} ${editing?.apiPath || ''}`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="timeoutSec"
            label={`超时时间（1 ~ ${maxSec} 秒）`}
            rules={[{ required: true, message: '请设置超时时间' }]}
          >
            <InputNumber min={1} max={maxSec} style={{ width: '100%' }} addonAfter="秒" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const PermissionTab = ({ cluster, operator }) => {
  const [signList, setSignList] = React.useState([]);
  const [authList, setAuthList] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState('signature');
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();

  const refresh = React.useCallback(() => {
    setSignList(loadPermissionList('signature', cluster));
    setAuthList(loadPermissionList('auth', cluster));
  }, [cluster]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = (type) => {
    setModalType(type);
    setEditing(null);
    form.setFieldsValue({
      appName: '',
      apiPath: '',
      enabled: true,
      remark: ''
    });
    setModalOpen(true);
  };

  const openEdit = (type, record) => {
    setModalType(type);
    setEditing(record);
    form.setFieldsValue({
      appName: record.appName,
      apiPath: record.apiPath,
      enabled: record.enabled,
      remark: record.remark || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const list = modalType === 'signature' ? signList : authList;
    const duplicated = list.some(
      (r) =>
        r.appName === values.appName.trim() &&
        r.apiPath === values.apiPath.trim() &&
        r.id !== editing?.id
    );
    if (duplicated) {
      message.error('同一应用下已存在相同 API 路径');
      return;
    }

    upsertPermissionItem(modalType, {
      id: editing?.id || createPermissionId(modalType === 'signature' ? 's' : 'a'),
      cluster,
      appName: values.appName.trim(),
      apiPath: values.apiPath.trim(),
      enabled: values.enabled,
      remark: (values.remark || '').trim(),
      operator: operator?.username
    });
    message.success(editing ? '已更新' : '已添加');
    setModalOpen(false);
    refresh();
  };

  const toggleEnabled = (type, record, enabled) => {
    upsertPermissionItem(type, { ...record, enabled, operator: operator?.username });
    message.success(enabled ? '已启用' : '已停用');
    refresh();
  };

  const handleDelete = (type, record) => {
    Modal.confirm({
      title: '确认删除该白名单项？',
      content: `${record.appName} ${record.apiPath}`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        removePermissionItem(type, record.id);
        message.success('已删除');
        refresh();
      }
    });
  };

  const buildColumns = (type) => [
    { title: '应用', dataIndex: 'appName', key: 'appName', width: 150 },
    { title: 'API 路径', dataIndex: 'apiPath', key: 'apiPath' },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (v) => v || '-'
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          checkedChildren="启用"
          unCheckedChildren="停用"
          onChange={(checked) => toggleEnabled(type, record, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(type, record)}>
            修改
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(type, record)}>
            删除
          </Button>
        </Space>
      )
    }
  ];

  const modalTitle =
    modalType === 'signature'
      ? editing
        ? '修改签名白名单'
        : '添加签名白名单'
      : editing
        ? '修改鉴权白名单'
        : '添加鉴权白名单';

  return (
    <div className="permission-tab">
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        命中白名单的路由才会强制校验。签名：客户端对路径与参数计算签名，用于反爬；鉴权：请求必须携带有效登录凭证。
      </Paragraph>

      <Card
        size="small"
        className="permission-section"
        title={
          <Space>
            <span>签名白名单</span>
            <Tooltip title="命中后网关校验请求签名（基于 path + 参数），未通过则拒绝，用于反爬">
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreate('signature')}>
            添加
          </Button>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          columns={buildColumns('signature')}
          dataSource={signList}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无签名白名单，公网/Open 接口建议配置' }}
        />
      </Card>

      <Card
        size="small"
        className="permission-section"
        style={{ marginTop: 16 }}
        title={
          <Space>
            <span>鉴权白名单</span>
            <Tooltip title="命中后网关校验统一登录态 / Token，未登录或凭证无效则拒绝">
              <QuestionCircleOutlined />
            </Tooltip>
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openCreate('auth')}>
            添加
          </Button>
        }
      >
        <Table
          rowKey="id"
          size="middle"
          columns={buildColumns('auth')}
          dataSource={authList}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: '暂无鉴权白名单' }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        okText="保存"
      >
        {modalType === 'signature' && (
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            请求方需对「路径 + 参数」生成签名并随请求提交；网关侧验签失败则拦截（反爬）。
          </Paragraph>
        )}
        {modalType === 'auth' && (
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            命中后须携带有效鉴权凭证（与统一登录 AUTH 打通）；与精准路由「用户态」配合使用。
          </Paragraph>
        )}
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="appName"
            label="应用"
            rules={[
              { required: true, message: '请输入应用名' },
              { pattern: /^[a-zA-Z0-9._-]+$/, message: '仅支持字母数字及 ._- ' }
            ]}
          >
            <Input placeholder="如 user-center" />
          </Form.Item>
          <Form.Item
            name="apiPath"
            label="API 路径"
            rules={[
              { required: true, message: '请输入 API 路径' },
              { pattern: /^\//, message: '路径需以 / 开头' }
            ]}
          >
            <Input placeholder="如 /api/content/public/**" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选说明" maxLength={200} showCount />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const GatewayCenter = ({ user, onBack }) => {
  const [cluster, setCluster] = React.useState('APP');
  const [routes, setRoutes] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('route');

  const refresh = React.useCallback(() => {
    setRoutes(loadRoutesByCluster(cluster));
  }, [cluster]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const clusterOptions = GATEWAY_CLUSTERS.map((c) => ({
    value: c.key,
    label: `${c.label}（${c.desc}）`
  }));

  return (
    <div className="gateway-center">
      <div className="gateway-header">
        <Space wrap>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回首页
          </Button>
          <Title level={4} style={{ margin: 0 }}>网关中心</Title>
          <Tag>GATEWAY</Tag>
        </Space>
        <Space>
          <Text>集群</Text>
          <Select
            value={cluster}
            onChange={(v) => {
              setCluster(v);
              setActiveTab('route');
            }}
            options={clusterOptions}
            style={{ minWidth: 280 }}
          />
        </Space>
      </div>

      <Card className="gateway-body" bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'route',
              label: '精准路由',
              children: (
                <PreciseRouteTab
                  cluster={cluster}
                  routes={routes}
                  onRefresh={refresh}
                  operator={user}
                />
              )
            },
            {
              key: 'timeout',
              label: '超时管控',
              children: (
                <TimeoutTab
                  cluster={cluster}
                  routes={routes}
                  onRefresh={refresh}
                  operator={user}
                />
              )
            },
            {
              key: 'permission',
              label: '权限管控',
              children: <PermissionTab cluster={cluster} operator={user} />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default GatewayCenter;
