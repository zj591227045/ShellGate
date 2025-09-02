import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Switch, Spin, message, Modal, Form, Input, Select, List, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CloudServerOutlined,
  HistoryOutlined,
  StarOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BulbOutlined,
  BulbFilled,
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { connectionService } from '../../services/connectionService';

const { Header, Sider, Content } = Layout;

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  description?: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false); // 默认展开状态
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [form] = Form.useForm();
  const [activeConnections, setActiveConnections] = useState<string[]>([]);
  const [connectingIds, setConnectingIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

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

  // 添加连接
  const handleAddConnection = () => {
    setEditingConnection(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 编辑连接
  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    form.setFieldsValue(connection);
    setIsModalVisible(true);
  };

  // 删除连接
  const handleDeleteConnection = async (id: string) => {
    try {
      await connectionService.deleteConnection(id);
      message.success('删除成功');
      fetchConnections();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 保存连接
  const handleSaveConnection = async () => {
    try {
      const values = await form.validateFields();
      if (editingConnection) {
        await connectionService.updateConnection(editingConnection.id, values);
        message.success('更新成功');
      } else {
        await connectionService.createConnection(values);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      fetchConnections();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 连接服务器
  const handleConnect = (connection: Connection) => {
    navigate('/dashboard', { state: { autoConnect: connection } });
  };

  // 根据当前路径确定选中的菜单项和展开的子菜单
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return ['dashboard'];
    if (path.includes('/history')) return ['history'];
    if (path.includes('/settings')) return ['settings'];
    return ['dashboard'];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return ['servers'];
    return [];
  };



  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'theme-toggle',
      icon: themeMode === 'dark' ? <BulbFilled /> : <BulbOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{themeMode === 'dark' ? '浅色模式' : '深色模式'}</span>
          <Switch
            size="small"
            checked={themeMode === 'dark'}
            onChange={toggleTheme}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </div>
      ),
      onClick: (e) => {
        e.domEvent.stopPropagation();
        toggleTheme();
      },
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ];

  return (
    <Layout className="app-layout">
      {/* 固定侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={themeMode}
        width={320}
        collapsedWidth={80}
        style={{
          background: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div className="logo" style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${theme.colors.border}`,
          background: theme.colors.surface,
          padding: collapsed ? '0' : '0 16px',
        }}>
          {!collapsed && <span style={{ fontWeight: 'bold', color: theme.colors.text }}>ShellGate</span>}
          {collapsed && <span style={{ fontWeight: 'bold', color: theme.colors.text }}>SG</span>}
        </div>

        {/* 侧边栏内容区域 */}
        <div style={{
          height: 'calc(100% - 64px)',
          display: 'flex',
          flexDirection: 'column',
          background: theme.colors.surface,
        }}>
          {!collapsed ? (
            <>
              {/* 导航菜单区域 */}
              <div style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                <Menu
                  theme={themeMode}
                  mode="inline"
                  selectedKeys={getSelectedKey()}
                  items={[
                    {
                      key: 'dashboard',
                      icon: <CloudServerOutlined />,
                      label: '服务器',
                      onClick: () => navigate('/dashboard'),
                    },
                    {
                      key: 'history',
                      icon: <HistoryOutlined />,
                      label: '命令历史',
                      onClick: () => navigate('/history'),
                    },
                    {
                      key: 'favorites',
                      icon: <StarOutlined />,
                      label: '收藏命令',
                    },
                    {
                      key: 'settings',
                      icon: <SettingOutlined />,
                      label: '设置',
                      onClick: () => navigate('/settings'),
                    },
                  ]}
                  style={{
                    background: 'transparent',
                    border: 'none',
                  }}
                />
              </div>

              {/* 服务器管理区域 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* 服务器区域标题和添加按钮 */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    color: theme.colors.text,
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    服务器列表
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleAddConnection}
                    style={{
                      color: theme.colors.primary,
                    }}
                    title="添加服务器"
                  />
                </div>

                {/* 服务器列表 */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin size="small" />
                    </div>
                  ) : connections.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: theme.colors.textSecondary
                    }}>
                      <DatabaseOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div style={{ fontSize: '12px' }}>暂无服务器</div>
                    </div>
                  ) : (
                    <div style={{ padding: '4px' }}>
                      {connections.map((connection) => (
                        <div
                          key={connection.id}
                          className="server-item"
                          style={{
                            padding: '8px 12px',
                            margin: '2px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              color: theme.colors.text,
                              fontSize: '13px',
                              fontWeight: 500,
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              <DatabaseOutlined style={{ marginRight: '6px', color: theme.colors.primary }} />
                              {connection.name}
                            </div>
                            <div style={{
                              color: theme.colors.textSecondary,
                              fontSize: '11px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {connection.host}:{connection.port}
                            </div>
                          </div>
                          <div className="server-actions" style={{ display: 'flex', gap: '4px' }}>
                            <Tooltip title="连接">
                              <Button
                                type="text"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnect(connection);
                                }}
                                style={{
                                  color: theme.colors.success,
                                  width: '24px',
                                  height: '24px',
                                  minWidth: '24px',
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="编辑">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditConnection(connection);
                                }}
                                style={{
                                  color: theme.colors.primary,
                                  width: '24px',
                                  height: '24px',
                                  minWidth: '24px',
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConnection(connection.id);
                                }}
                                style={{
                                  color: theme.colors.error,
                                  width: '24px',
                                  height: '24px',
                                  minWidth: '24px',
                                }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 收起状态下的图标菜单 */
            <Menu
              theme={themeMode}
              mode="inline"
              selectedKeys={getSelectedKey()}
              items={[
                {
                  key: 'dashboard',
                  icon: <CloudServerOutlined />,
                  onClick: () => navigate('/dashboard'),
                },
                {
                  key: 'history',
                  icon: <HistoryOutlined />,
                  onClick: () => navigate('/history'),
                },
                {
                  key: 'favorites',
                  icon: <StarOutlined />,
                },
                {
                  key: 'settings',
                  icon: <SettingOutlined />,
                  onClick: () => navigate('/settings'),
                },
              ]}
              style={{
                background: 'transparent',
                border: 'none',
              }}
            />
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: theme.colors.surface,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.colors.border}`,
            boxShadow: theme.antdTheme.token.boxShadowSecondary,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              color: theme.colors.text,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 快速主题切换按钮 */}
            <Button
              type="text"
              icon={themeMode === 'dark' ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
              style={{ color: theme.colors.text }}
              title={themeMode === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            />
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'all 0.3s',
                color: theme.colors.text,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.surfaceElevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: theme.colors.primary,
                  }}
                />
                <span>{user?.username || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className="main-content"
          style={{
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 添加/编辑服务器模态框 */}
      <Modal
        title={editingConnection ? '编辑服务器' : '添加服务器'}
        open={isModalVisible}
        onOk={handleSaveConnection}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            protocol: 'ssh',
            port: 22,
          }}
        >
          <Form.Item
            label="服务器名称"
            name="name"
            rules={[{ required: true, message: '请输入服务器名称' }]}
          >
            <Input placeholder="请输入服务器名称" />
          </Form.Item>

          <Form.Item
            label="主机地址"
            name="host"
            rules={[{ required: true, message: '请输入主机地址' }]}
          >
            <Input placeholder="请输入主机地址或IP" />
          </Form.Item>

          <Form.Item
            label="端口"
            name="port"
            rules={[{ required: true, message: '请输入端口号' }]}
          >
            <Input type="number" placeholder="请输入端口号" />
          </Form.Item>

          <Form.Item
            label="协议"
            name="protocol"
            rules={[{ required: true, message: '请选择协议' }]}
          >
            <Select>
              <Select.Option value="ssh">SSH</Select.Option>
              <Select.Option value="telnet">Telnet</Select.Option>
              <Select.Option value="rdp">RDP</Select.Option>
              <Select.Option value="vnc">VNC</Select.Option>
              <Select.Option value="sftp">SFTP</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea placeholder="请输入描述信息（可选）" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainLayout;
