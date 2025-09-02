import React, { useState, useEffect } from 'react';
import { Layout, Button, Modal, Form, Input, Select, message, Card, Spin, Tabs, Radio, Upload } from 'antd';
import { PlusOutlined, CloudServerOutlined, UploadOutlined } from '@ant-design/icons';
import ServerList from '../../components/ServerList/ServerList';
import TerminalComponent from '../../components/Terminal/TerminalComponent';
import { useTheme } from '../../contexts/ThemeContext';
import { connectionService } from '../../services/connectionService';
import { websocketService } from '../../services/websocketService';

const { Sider, Content } = Layout;
const { Option } = Select;

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  password?: string;
  privateKey?: string;
  authType?: 'password' | 'privateKey';
  description?: string;
}

interface TerminalTab {
  key: string;
  label: string;
  connectionId: string;
  sessionId: string;
}

const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [connectingIds, setConnectingIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const [authType, setAuthType] = useState<'password' | 'privateKey'>('password');

  // 获取连接列表
  const fetchConnections = async () => {
    try {
      setLoading(true);
      const data = await connectionService.getConnections();
      setConnections(data);
    } catch (error) {
      message.error('获取连接列表失败');
      console.error('获取连接列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnect = async (connection: Connection) => {
    // 检查是否已经有该连接的终端标签页
    const existingTab = terminalTabs.find(tab => tab.connectionId === connection.id);
    if (existingTab) {
      setActiveTabKey(existingTab.key);
      message.info(`${connection.name} 已经连接`);
      return;
    }

    try {
      setConnectingIds([...connectingIds, connection.id]);
      message.loading(`正在连接到 ${connection.name}...`, 0);

      // 确保WebSocket连接
      if (!websocketService.isSocketConnected()) {
        websocketService.connect();
        // 等待WebSocket连接建立
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('WebSocket连接超时')), 10000);
          websocketService.once('connected', () => {
            clearTimeout(timeout);
            resolve(void 0);
          });
          websocketService.once('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      }

      // 创建SSH会话，传递密码
      const sessionId = await websocketService.createSession(connection.id, connection.password);

      // 创建新的终端标签页
      const newTab: TerminalTab = {
        key: `terminal-${connection.id}-${Date.now()}`,
        label: connection.name,
        connectionId: connection.id,
        sessionId: sessionId
      };

      // 更新状态
      setTerminalTabs([...terminalTabs, newTab]);
      setActiveTabKey(newTab.key);
      setActiveConnections([...activeConnections, connection.id]);
      setConnectingIds(connectingIds.filter(id => id !== connection.id));

      message.destroy();
      message.success(`已连接到 ${connection.name}`);

    } catch (error) {
      setConnectingIds(connectingIds.filter(id => id !== connection.id));
      message.destroy();
      message.error(`连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
      console.error('连接失败:', error);
    }
  };



  const handleCloseTab = (targetKey: string) => {
    const targetTab = terminalTabs.find(tab => tab.key === targetKey);
    if (targetTab) {
      // 关闭WebSocket会话
      websocketService.disconnectSession(targetTab.sessionId);

      // 移除标签页
      const newTabs = terminalTabs.filter(tab => tab.key !== targetKey);
      setTerminalTabs(newTabs);

      // 移除活跃连接
      setActiveConnections(activeConnections.filter(id => id !== targetTab.connectionId));

      // 如果关闭的是当前活跃标签页，切换到其他标签页
      if (activeTabKey === targetKey) {
        if (newTabs.length > 0) {
          setActiveTabKey(newTabs[newTabs.length - 1].key);
        } else {
          setActiveTabKey('');
        }
      }
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  const handleAddConnection = () => {
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // 调用API创建连接
      const newConnection = await connectionService.createConnection(values);

      // 更新本地状态
      setConnections([...connections, newConnection]);
      setIsModalVisible(false);
      form.resetFields();
      message.success('连接已添加');
    } catch (error) {
      message.error('添加连接失败');
      console.error('添加连接失败:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setAuthType('password');
  };

  return (
    <Layout style={{ height: '100%', background: theme.colors.background }}>
      <Sider
        width={320}
        style={{
          background: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
          boxShadow: theme.antdTheme.token.boxShadowSecondary,
        }}
      >
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.surface,
        }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddConnection}
            block
            style={{
              background: theme.colors.primary,
              borderColor: theme.colors.primary,
              height: '40px',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            添加连接
          </Button>
        </div>
        <div style={{
          height: 'calc(100% - 88px)',
          overflow: 'auto',
          background: theme.colors.surface,
          position: 'relative',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
            }}>
              <Spin size="large" />
            </div>
          ) : connections.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px',
              color: theme.colors.textSecondary,
              textAlign: 'center',
              padding: '20px',
            }}>
              <CloudServerOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>暂无连接</p>
              <p style={{ fontSize: '12px' }}>点击上方按钮添加第一个连接</p>
            </div>
          ) : (
            <ServerList
              connections={connections}
              onConnect={handleConnect}
              activeConnections={activeConnections}
              connectingIds={connectingIds}
            />
          )}
        </div>
      </Sider>
      <Content style={{
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.background,
        height: '100%',
      }}>
        {terminalTabs.length === 0 ? (
          // 没有终端时显示欢迎界面
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '24px',
          }}>
            <Card
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                boxShadow: theme.antdTheme.token.boxShadow,
                textAlign: 'center',
                maxWidth: '500px',
                width: '100%',
              }}
              bodyStyle={{ padding: '48px 24px' }}
            >
              <CloudServerOutlined
                style={{
                  fontSize: '64px',
                  color: theme.colors.primary,
                  marginBottom: '24px',
                  display: 'block',
                }}
              />
              <h2 style={{
                color: theme.colors.text,
                marginBottom: '16px',
                fontSize: '20px',
                fontWeight: 600,
              }}>
                暂无活跃终端会话
              </h2>
              <p style={{
                color: theme.colors.textSecondary,
                fontSize: '16px',
                lineHeight: '1.6',
                marginBottom: '24px',
              }}>
                请从左侧服务器列表点击连接，直接在此处打开终端
              </p>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddConnection}
                style={{
                  background: theme.colors.primary,
                  borderColor: theme.colors.primary,
                }}
              >
                添加新连接
              </Button>
            </Card>
          </div>
        ) : (
          // 有终端时显示标签页和终端内容
          <>
            <div style={{
              background: theme.colors.surface,
              borderBottom: `1px solid ${theme.colors.border}`,
              padding: '0 16px',
            }}>
              <Tabs
                type="editable-card"
                activeKey={activeTabKey}
                onChange={handleTabChange}
                onEdit={(targetKey, action) => {
                  if (action === 'remove') {
                    handleCloseTab(targetKey as string);
                  }
                }}
                items={terminalTabs.map(tab => ({
                  key: tab.key,
                  label: tab.label,
                  closable: true,
                }))}
                style={{
                  margin: 0,
                }}
                tabBarStyle={{
                  margin: 0,
                  background: 'transparent',
                }}
              />
            </div>
            <div style={{
              flex: 1,
              minHeight: '500px',
              background: theme.colors.background,
              position: 'relative',
              padding: '16px',
            }}>
              {terminalTabs.map(tab => {
                const connection = connections.find(conn => conn.id === tab.connectionId);
                if (!connection) return null;

                return (
                  <div
                    key={tab.key}
                    style={{
                      display: activeTabKey === tab.key ? 'block' : 'none',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <TerminalComponent
                      sessionId={tab.sessionId}
                      connection={connection}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
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
          initialValues={{ protocol: 'ssh', port: 22, authType: 'password' }}
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
            name="authType"
            label="认证方式"
            rules={[{ required: true, message: '请选择认证方式' }]}
          >
            <Radio.Group onChange={(e) => setAuthType(e.target.value)}>
              <Radio value="password">密码认证</Radio>
              <Radio value="privateKey">私钥认证</Radio>
            </Radio.Group>
          </Form.Item>

          {authType === 'password' ? (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="登录密码" />
            </Form.Item>
          ) : (
            <Form.Item
              name="privateKey"
              label="私钥"
              rules={[{ required: true, message: '请输入私钥内容' }]}
            >
              <Input.TextArea
                placeholder="请粘贴私钥内容，或使用下方上传按钮"
                rows={6}
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          )}

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
