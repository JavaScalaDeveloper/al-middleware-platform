import React from 'react';
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import {
  ArrowLeftOutlined, FileProtectOutlined, SettingOutlined
} from '@ant-design/icons';
import AppConfigPanel from './AppConfigPanel';
import TicketPanel from './TicketPanel';
import './ConfigCenter.css';

const { Sider, Content } = Layout;
const { Title } = Typography;

const ConfigCenter = ({ user, onBack }) => {
  const [menuKey, setMenuKey] = React.useState('apps');

  return (
    <div className="config-center">
      <div className="config-center-header">
        <Space wrap>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
            返回首页
          </Button>
          <Title level={4} style={{ margin: 0 }}>配置中心</Title>
          <Tag>CONFIG</Tag>
        </Space>
      </div>

      <Layout className="config-center-body">
        <Sider width={180} theme="light" className="config-center-sider">
          <Menu
            mode="inline"
            selectedKeys={[menuKey]}
            onClick={({ key }) => setMenuKey(key)}
            items={[
              {
                key: 'apps',
                icon: <SettingOutlined />,
                label: '应用配置'
              },
              {
                key: 'tickets',
                icon: <FileProtectOutlined />,
                label: '工单'
              }
            ]}
          />
        </Sider>
        <Content className="config-center-content">
          {menuKey === 'apps' ? <AppConfigPanel /> : <TicketPanel user={user} />}
        </Content>
      </Layout>
    </div>
  );
};

export default ConfigCenter;
