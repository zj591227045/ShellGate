import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Tooltip,
  Modal,
  message,
  DatePicker,
  Select
} from 'antd';
import { 
  SearchOutlined, 
  StarOutlined, 
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { commandService } from '../../services/commandService';
import type { ColumnsType } from 'antd/es/table';

const { Content } = Layout;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface CommandLog {
  id: string;
  command: string;
  output?: string;
  timestamp: Date;
  duration?: number;
  sessionId: string;
  connectionName?: string;
}

const HistoryPage: React.FC = () => {
  const [commands, setCommands] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<CommandLog | null>(null);
  const [outputModalVisible, setOutputModalVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    fetchCommands();
  }, [pagination.current, pagination.pageSize, searchText]);

  const fetchCommands = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(searchText && { q: searchText }),
      };

      const response = searchText 
        ? await commandService.searchHistory(searchText, params)
        : await commandService.getHistory(params);

      setCommands(response.items);
      setPagination(prev => ({
        ...prev,
        total: response.total,
      }));
    } catch (error) {
      message.error('获取命令历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    message.success('命令已复制到剪贴板');
  };

  const handleAddToFavorites = async (command: CommandLog) => {
    try {
      await commandService.addFavorite({
        name: `命令_${new Date().getTime()}`,
        command: command.command,
        description: `来自 ${command.connectionName || '未知连接'}`,
      });
      message.success('已添加到收藏');
    } catch (error) {
      message.error('添加收藏失败');
    }
  };

  const handleViewOutput = (command: CommandLog) => {
    setSelectedCommand(command);
    setOutputModalVisible(true);
  };

  const columns: ColumnsType<CommandLog> = [
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
      ellipsis: {
        showTitle: false,
      },
      render: (command: string) => (
        <Tooltip title={command}>
          <code style={{ 
            background: '#f6f8fa', 
            padding: '2px 4px', 
            borderRadius: '3px',
            fontSize: '12px'
          }}>
            {command}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '连接',
      dataIndex: 'connectionName',
      key: 'connectionName',
      width: 120,
      render: (name: string) => name ? <Tag color="blue">{name}</Tag> : '-',
    },
    {
      title: '执行时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: Date) => new Date(timestamp).toLocaleString(),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration?: number) => 
        duration ? `${duration}ms` : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="复制命令">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyCommand(record.command)}
            />
          </Tooltip>
          <Tooltip title="添加到收藏">
            <Button
              type="text"
              size="small"
              icon={<StarOutlined />}
              onClick={() => handleAddToFavorites(record)}
            />
          </Tooltip>
          {record.output && (
            <Tooltip title="查看输出">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewOutput(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Space size="middle">
          <Search
            placeholder="搜索命令..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ width: 400 }}
            onSearch={handleSearch}
          />
          <RangePicker />
          <Select
            placeholder="选择连接"
            style={{ width: 200 }}
            allowClear
          >
            <Option value="all">所有连接</Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={commands}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          onChange: (page, pageSize) => {
            setPagination(prev => ({
              ...prev,
              current: page,
              pageSize: pageSize || prev.pageSize,
            }));
          },
        }}
        scroll={{ y: 'calc(100vh - 300px)' }}
      />

      <Modal
        title="命令输出"
        open={outputModalVisible}
        onCancel={() => setOutputModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setOutputModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedCommand && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>命令：</strong>
              <code style={{ 
                background: '#f6f8fa', 
                padding: '4px 8px', 
                borderRadius: '3px',
                marginLeft: 8
              }}>
                {selectedCommand.command}
              </code>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>输出：</strong>
            </div>
            <pre style={{
              background: '#1e1e1e',
              color: '#ffffff',
              padding: 16,
              borderRadius: 4,
              maxHeight: 400,
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            }}>
              {selectedCommand.output || '无输出'}
            </pre>
          </div>
        )}
      </Modal>
    </Content>
  );
};

export default HistoryPage;
