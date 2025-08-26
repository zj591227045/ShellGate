import React, { useState } from 'react';
import { Layout, Button, Modal, Form, Input, Select, message, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import ServerList from '../../components/ServerList/ServerList';

const { Sider, Content } = Layout;
const { Option } = Select;

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  description?: string;
}

const DashboardPage: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: '1',
      name: 'iStoreOS',
      host: '192.168.1.1',
      port: 22,
      protocol: 'ssh',
      username: 'root',
      description: 'iStoreOS 路由器'
    },
    {
      id: '2', 
      name: 'Jackson-PVE',
      host: '192.168.1.100',
      port: 22,
      protocol: 'ssh',
      username: 'root',
      description: 'Proxmox VE 服务器'
    }
  ]);

  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleConnect = (connection: Connection) => {
    if (!activeConnections.includes(connection.id)) {
      setActiveConnections([...activeConnections, connection.id]);
      message.success(`正在连接到 ${connection.name}`);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    setActiveConnections(activeConnections.filter(id => id !== connectionId));
  };

  const handleAddConnection = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const newConnection: Connection = {
        id: Date.now().toString(),
        ...values
      };
      setConnections([...connections, newConnection]);
      setIsModalVisible(false);
      form.resetFields();
      message.success('连接已添加');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <Layout style={{ height: '100%' }}>
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddConnection}
            block
          >
            添加连接
          </Button>
        </div>
        <ServerList 
          connections={connections}
          onConnect={handleConnect}
          activeConnections={activeConnections}
        />
      </Sider>
      <Content style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <Empty
          description="请从左侧选择一个连接，然后前往终端页面开始使用"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Content>

      <Modal
        title="添加新连接"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ protocol: 'ssh', port: 22 }}
        >
          <Form.Item
            name="name"
            label="连接名称"
            rules={[{ required: true, message: '请输入连接名称' }]}
          >
            <Input placeholder="例如：生产服务器" />
          </Form.Item>

          <Form.Item
            name="protocol"
            label="协议类型"
            rules={[{ required: true, message: '请选择协议类型' }]}
          >
            <Select>
              <Option value="ssh">SSH</Option>
              <Option value="telnet">Telnet</Option>
              <Option value="rdp">RDP</Option>
              <Option value="vnc">VNC</Option>
              <Option value="sftp">SFTP</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="host"
            label="主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="IP地址或域名" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <Input type="number" placeholder="22" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="登录用户名" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="连接描述（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default DashboardPage;
