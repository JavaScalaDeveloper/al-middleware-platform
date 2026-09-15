import React from 'react';
import { Button, Space, Table, Tag, Typography, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { handleTicket, listTickets } from '../../api/config';

const { Text } = Typography;

const TYPE_LABEL = {
  APP_PERMISSION: '应用权限申请',
  CONFIG_PUBLISH: '配置发布'
};

const STATUS_TAG = {
  PENDING: <Tag color="orange">待处理</Tag>,
  APPROVED: <Tag color="green">已通过</Tag>,
  REJECTED: <Tag color="red">已驳回</Tag>,
  DONE: <Tag color="blue">已完成</Tag>
};

const TicketPanel = ({ user }) => {
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await listTickets());
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const onHandle = async (ticket, action) => {
    try {
      await handleTicket(ticket.id, action);
      message.success(action === 'approve' ? '已通过' : '已驳回');
      refresh();
    } catch (e) {
      message.error(e.message);
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div>
      <div className="config-toolbar">
        <Text type="secondary">权限申请与配置发布记录</Text>
        <Button onClick={refresh} loading={loading}>刷新</Button>
      </div>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={tickets}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '标题', dataIndex: 'title' },
          {
            title: '类型',
            dataIndex: 'type',
            width: 140,
            render: (t) => TYPE_LABEL[t] || t
          },
          { title: '应用', dataIndex: 'appName', width: 140 },
          { title: '申请人', dataIndex: 'applicant', width: 120 },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s) => STATUS_TAG[s] || s
          },
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 180,
            render: (t) => (t ? new Date(t).toLocaleString() : '-')
          },
          {
            title: '操作',
            width: 180,
            render: (_, record) => {
              if (record.status !== 'PENDING' || !isAdmin) {
                return <Text type="secondary">-</Text>;
              }
              return (
                <Space>
                  <Button
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => onHandle(record, 'approve')}
                  >
                    通过
                  </Button>
                  <Button
                    type="link"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => onHandle(record, 'reject')}
                  >
                    驳回
                  </Button>
                </Space>
              );
            }
          }
        ]}
      />
    </div>
  );
};

export default TicketPanel;
