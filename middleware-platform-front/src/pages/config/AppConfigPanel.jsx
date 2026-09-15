import React from 'react';
import {
  Button, Card, Col, Empty, Input, Modal, Row, Space, Tabs, Tag, Typography, message
} from 'antd';
import { KeyOutlined, SearchOutlined } from '@ant-design/icons';
import { applyAppPermission, listApps } from '../../api/config';
import AppDetail from './AppDetail';

const { Text, Paragraph } = Typography;

const statusTag = (status) => {
  switch (status) {
    case 'APPROVED':
      return <Tag color="green">已授权</Tag>;
    case 'PENDING':
      return <Tag color="orange">审批中</Tag>;
    case 'REJECTED':
      return <Tag color="red">已驳回</Tag>;
    default:
      return <Tag>未申请</Tag>;
  }
};

const AppConfigPanel = () => {
  const [scope, setScope] = React.useState('mine');
  const [keywordInput, setKeywordInput] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [apps, setApps] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedApp, setSelectedApp] = React.useState(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listApps(scope, keyword.trim());
      setApps(data || []);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [scope, keyword]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const doSearch = () => setKeyword(keywordInput.trim());

  const handleApply = (app) => {
    let remark = '';
    Modal.confirm({
      title: `申请「${app.name}」权限`,
      content: (
        <Input.TextArea
          rows={3}
          placeholder="申请说明（可选）"
          onChange={(e) => {
            remark = e.target.value;
          }}
        />
      ),
      okText: '提交申请',
      cancelText: '取消',
      onOk: async () => {
        try {
          await applyAppPermission(app.id, remark);
          message.success('已提交权限申请，请在「工单」中查看');
          refresh();
        } catch (e) {
          message.error(e.message);
          throw e;
        }
      }
    });
  };

  if (selectedApp) {
    return <AppDetail app={selectedApp} onBack={() => { setSelectedApp(null); refresh(); }} />;
  }

  const renderCards = (list) => {
    if (!loading && list.length === 0) {
      return <Empty description={scope === 'mine' ? '暂无已授权应用，请到「全部应用」申请' : '暂无匹配应用'} />;
    }
    return (
      <Row gutter={[16, 16]}>
        {list.map((app) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={app.id}>
            <Card
              className={`config-app-card ${app.hasPermission ? 'clickable' : ''}`}
              title={
                <Space>
                  <KeyOutlined />
                  <span>{app.name}</span>
                </Space>
              }
              extra={statusTag(app.permissionStatus)}
              onClick={() => {
                if (app.hasPermission) setSelectedApp(app);
              }}
              actions={
                app.hasPermission
                  ? [
                      <Button type="link" key="open" onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}>
                        进入配置
                      </Button>
                    ]
                  : [
                      <Button
                        type="link"
                        key="apply"
                        disabled={app.permissionStatus === 'PENDING'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(app);
                        }}
                      >
                        {app.permissionStatus === 'PENDING' ? '审批中' : '申请权限'}
                      </Button>
                    ]
              }
            >
              <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ minHeight: 44 }}>
                {app.description || '暂无描述'}
              </Paragraph>
              <Text code>{app.code}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="config-app-panel">
      <div className="config-toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索应用名称 / 编码"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onPressEnter={doSearch}
          style={{ maxWidth: 320 }}
        />
        <Space>
          <Button type="primary" onClick={doSearch}>搜索</Button>
          <Button onClick={refresh} loading={loading}>刷新</Button>
        </Space>
      </div>

      <Tabs
        activeKey={scope}
        onChange={setScope}
        items={[
          {
            key: 'mine',
            label: '我的应用',
            children: renderCards(apps)
          },
          {
            key: 'all',
            label: '全部应用',
            children: renderCards(apps)
          }
        ]}
      />
    </div>
  );
};

export default AppConfigPanel;
