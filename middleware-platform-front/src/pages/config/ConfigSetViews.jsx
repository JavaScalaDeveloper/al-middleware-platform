import React from 'react';
import {
  Button, Form, Input, Modal, Popconfirm, Space, Table, Tabs, Tag,
  Typography, message
} from 'antd';
import {
  EditOutlined, FileTextOutlined, PlusOutlined, SearchOutlined, SendOutlined
} from '@ant-design/icons';
import {
  createSet, deleteSet, getSet, itemsToText, listSets, publishSet, renameSet,
  saveSetItems, saveSetText, textToItemList
} from '../../api/config';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const matchKeyword = (set, keyword) => {
  const kw = String(keyword || '').trim().toLowerCase();
  if (!kw) return true;
  if (String(set.name || '').toLowerCase().includes(kw)) return true;
  const items = set.items || {};
  return Object.entries(items).some(([key, value]) => {
    const k = String(key || '').toLowerCase();
    const v = String(value ?? '').toLowerCase();
    return k.includes(kw) || v.includes(kw);
  });
};

const ConfigSetEditor = ({ setMeta, onChanged, compact }) => {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState([]);
  const [text, setText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('table');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSet(setMeta.id);
      setDetail(data);
      const itemMap = data.items || {};
      setRows(Object.entries(itemMap).map(([key, value]) => ({ key, value, _id: `${key}_${Math.random()}` })));
      setText(itemsToText(itemMap));
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [setMeta.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const syncTextFromRows = (nextRows) => {
    const map = {};
    nextRows.forEach((r) => {
      if (r.key) map[r.key] = r.value ?? '';
    });
    setText(itemsToText(map));
  };

  const syncRowsFromText = (nextText) => {
    const list = textToItemList(nextText).map((r) => ({ ...r, _id: `${r.key}_${Math.random()}` }));
    setRows(list);
  };

  const collectItems = () => {
    if (activeTab === 'text') {
      return textToItemList(text).map((r) => ({ key: r.key, value: r.value ?? '' }));
    }
    return rows
      .filter((r) => r.key && String(r.key).trim())
      .map((r) => ({ key: String(r.key).trim(), value: r.value ?? '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let data;
      if (activeTab === 'text') {
        data = await saveSetText(setMeta.id, text);
        syncRowsFromText(text);
      } else {
        const items = collectItems();
        data = await saveSetItems(setMeta.id, items);
        setText(itemsToText(Object.fromEntries(items.map((i) => [i.key, i.value]))));
      }
      setDetail(data);
      message.success('配置已保存（未发布）');
      onChanged?.(data);
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      if (activeTab === 'text') {
        await saveSetText(setMeta.id, text);
      } else {
        await saveSetItems(setMeta.id, collectItems());
      }
      const data = await publishSet(setMeta.id);
      setDetail(data);
      message.success(`已发布 v${data.version}`);
      onChanged?.(data);
      await load();
    } catch (e) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'key',
      render: (_, record, index) => (
        <Input
          value={record.key}
          placeholder="配置键"
          onChange={(e) => {
            const next = [...rows];
            next[index] = { ...next[index], key: e.target.value };
            setRows(next);
            syncTextFromRows(next);
          }}
        />
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (_, record, index) => (
        <Input
          value={record.value}
          placeholder="配置值"
          onChange={(e) => {
            const next = [...rows];
            next[index] = { ...next[index], value: e.target.value };
            setRows(next);
            syncTextFromRows(next);
          }}
        />
      )
    },
    {
      title: '操作',
      width: 80,
      render: (_, __, index) => (
        <Button
          type="link"
          danger
          onClick={() => {
            const next = rows.filter((_, i) => i !== index);
            setRows(next);
            syncTextFromRows(next);
          }}
        >
          删除
        </Button>
      )
    }
  ];

  return (
    <div className={`config-set-editor ${compact ? 'config-set-editor-compact' : ''}`}>
      <div className="config-set-editor-header">
        <Space wrap>
          {!compact && <Text strong>{detail?.name || setMeta.name}</Text>}
          {detail?.published ? (
            <Tag color="green">已发布 v{detail.version}</Tag>
          ) : (
            <Tag color="orange">有未发布变更</Tag>
          )}
        </Space>
        <Space>
          <Button loading={saving} onClick={handleSave}>保存</Button>
          <Button type="primary" icon={<SendOutlined />} loading={saving} onClick={handlePublish}>
            提交发布
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        size={compact ? 'small' : 'middle'}
        onChange={(key) => {
          if (key === 'text') syncTextFromRows(rows);
          if (key === 'table') syncRowsFromText(text);
          setActiveTab(key);
        }}
        items={[
          {
            key: 'table',
            label: '配置表格',
            children: (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const next = [...rows, { key: '', value: '', _id: `n_${Date.now()}` }];
                      setRows(next);
                    }}
                  >
                    新增配置项
                  </Button>
                </div>
                <Table
                  loading={loading}
                  rowKey="_id"
                  columns={columns}
                  dataSource={rows}
                  pagination={false}
                  size="small"
                />
              </>
            )
          },
          {
            key: 'text',
            label: '配置文本',
            children: (
              <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoSize={{ minRows: 10, maxRows: 22 }}
                placeholder={'server.port=8080\nspring.application.name=demo'}
                className="config-text-area"
              />
            )
          }
        ]}
      />
    </div>
  );
};

const ConfigSetList = ({ app, group }) => {
  const [sets, setSets] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form] = Form.useForm();
  const [keywordInput, setKeywordInput] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);

  const refresh = React.useCallback(async () => {
    if (!app || !group) return;
    setLoading(true);
    try {
      setSets(await listSets(app.id, group.id));
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [app, group]);

  React.useEffect(() => {
    setExpandedRowKeys([]);
    setKeywordInput('');
    setKeyword('');
    refresh();
  }, [refresh]);

  const filteredSets = React.useMemo(
    () => sets.filter((s) => matchKeyword(s, keyword)),
    [sets, keyword]
  );

  const doSearch = () => {
    setKeyword(keywordInput.trim());
  };

  const toggleExpand = (record) => {
    setExpandedRowKeys((prev) =>
      prev.includes(record.id) ? prev.filter((id) => id !== record.id) : [...prev, record.id]
    );
  };

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ name: '' });
    setModalOpen(true);
  };

  const openRename = (record) => {
    setEditing(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await renameSet(editing.id, values.name);
        message.success('配置集已修改');
      } else {
        const created = await createSet(app.id, group.id, values.name);
        message.success('配置集已新增');
        setExpandedRowKeys((prev) => [...prev, created.id]);
      }
      setModalOpen(false);
      refresh();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleDelete = async (record) => {
    try {
      await deleteSet(record.id);
      message.success('已删除');
      setExpandedRowKeys((prev) => prev.filter((id) => id !== record.id));
      refresh();
    } catch (e) {
      message.error(e.message);
    }
  };

  const handleEditorChanged = (updated) => {
    if (!updated) {
      refresh();
      return;
    }
    setSets((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
  };

  return (
    <div>
      <div className="config-toolbar">
        <div>
          <Text strong>配置集</Text>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            分组 {group.code}（{group.name}）
          </Paragraph>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索 key / value"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onPressEnter={doSearch}
            style={{ width: 220 }}
          />
          <Button icon={<SearchOutlined />} onClick={doSearch}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增配置集
          </Button>
        </Space>
      </div>
      <Table
        loading={loading}
        rowKey="id"
        dataSource={filteredSets}
        pagination={false}
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: setExpandedRowKeys,
          expandedRowRender: (record) => (
            <ConfigSetEditor
              setMeta={record}
              compact
              onChanged={handleEditorChanged}
            />
          )
        }}
        locale={{
          emptyText: keyword
            ? `未找到包含「${keyword}」的配置 key/value`
            : '暂无配置集'
        }}
        columns={[
          {
            title: '名称',
            dataIndex: 'name',
            render: (name, record) => (
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={() => toggleExpand(record)}
              >
                {name}
              </Button>
            )
          },
          {
            title: '版本',
            dataIndex: 'version',
            width: 90,
            render: (v, r) => (r.published ? `v${v}` : '-')
          },
          {
            title: '状态',
            width: 110,
            render: (_, r) => (r.published ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag>)
          },
          {
            title: '操作',
            width: 180,
            render: (_, record) => (
              <Space>
                <Button type="link" icon={<EditOutlined />} onClick={() => openRename(record)}>修改</Button>
                <Popconfirm title="确认删除该配置集？" onConfirm={() => handleDelete(record)}>
                  <Button type="link" danger>删除</Button>
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />
      <Modal
        title={editing ? '修改配置集' : '新增配置集'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnHidden
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item
            name="name"
            label="配置集名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如 application.properties" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export { ConfigSetEditor, ConfigSetList };
