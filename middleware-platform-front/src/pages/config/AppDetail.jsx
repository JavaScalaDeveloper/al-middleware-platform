import React from 'react';
import {
  Button, Form, Input, Layout, Menu, Modal, Popconfirm, Space, Typography, message
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { createGroup, deleteGroup, listGroups } from '../../api/config';
import { ConfigSetList } from './ConfigSetViews';

const { Sider, Content } = Layout;
const { Text } = Typography;

const AppDetail = ({ app, onBack }) => {
  const [groups, setGroups] = React.useState([]);
  const [activeGroupId, setActiveGroupId] = React.useState(null);
  const [groupModal, setGroupModal] = React.useState(false);
  const [form] = Form.useForm();

  const refreshGroups = React.useCallback(async () => {
    try {
      const list = await listGroups(app.id);
      setGroups(list);
      setActiveGroupId((prev) => {
        if (prev && list.some((g) => g.id === prev)) return prev;
        return list[0]?.id || null;
      });
    } catch (e) {
      message.error(e.message);
    }
  }, [app.id]);

  React.useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleCreateGroup = async () => {
    const values = await form.validateFields();
    try {
      const group = await createGroup(app.id, values.code, values.name);
      message.success('分组已新增');
      setGroupModal(false);
      await refreshGroups();
      setActiveGroupId(group.id);
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDeleteGroup = async (group) => {
    try {
      await deleteGroup(app.id, group.id);
      message.success('分组已删除');
      await refreshGroups();
    } catch (e) {
      message.error(e.message);
    }
  };

  return (
    <div className="config-app-detail">
      <div className="config-app-detail-header">
        <Space>
          <Button onClick={onBack}>返回应用列表</Button>
          <Text strong>{app.name}</Text>
          <Text type="secondary">({app.code})</Text>
        </Space>
      </div>

      <Layout className="config-app-detail-body">
        <Sider width={200} theme="light" className="config-group-sider">
          <div className="config-group-sider-title">
            <span>环境分组</span>
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                form.setFieldsValue({ code: '', name: '' });
                setGroupModal(true);
              }}
            >
              新增
            </Button>
          </div>
          <Menu
            mode="inline"
            selectedKeys={activeGroupId ? [activeGroupId] : []}
            onClick={({ key }) => setActiveGroupId(key)}
            items={groups.map((g) => ({
              key: g.id,
              label: (
                <div className="config-group-item">
                  <span>
                    <Text strong>{g.code}</Text>
                    <Text type="secondary" style={{ marginLeft: 6, fontSize: 12 }}>{g.name}</Text>
                  </span>
                  <Popconfirm
                    title={`删除分组 ${g.code}？其下配置集将一并删除`}
                    onConfirm={(e) => {
                      e?.stopPropagation?.();
                      handleDeleteGroup(g);
                    }}
                    onCancel={(e) => e?.stopPropagation?.()}
                  >
                    <DeleteOutlined
                      className="config-group-delete"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              )
            }))}
          />
        </Sider>
        <Content className="config-app-detail-content">
          {!activeGroup ? (
            <Text type="secondary">请先新增环境分组（如 D1、T1、PROD）</Text>
          ) : (
            <ConfigSetList app={app} group={activeGroup} />
          )}
        </Content>
      </Layout>

      <Modal
        title="新增环境分组"
        open={groupModal}
        onOk={handleCreateGroup}
        onCancel={() => setGroupModal(false)}
        destroyOnHidden
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="code"
            label="分组编码"
            rules={[{ required: true, message: '请输入编码' }]}
            extra="例如 D1、D2、T1、T2、PRE、PROD"
          >
            <Input placeholder="D1" />
          </Form.Item>
          <Form.Item name="name" label="分组名称">
            <Input placeholder="开发环境-1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppDetail;
