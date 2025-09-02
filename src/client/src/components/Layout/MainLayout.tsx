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
import ThemeSelector from '../ThemeSelector/ThemeSelector';
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
      {/* 现代化侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="modern-sider"
        width={320}
        collapsedWidth={80}
        style={{
          overflow: 'hidden',
          background: 'var(--color-sidebar-bg)',
          borderRight: `1px solid var(--color-sidebar-border)`,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="logo" style={{
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          margin: '16px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? '18px' : '16px',
          transition: 'var(--transition-normal)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {!collapsed && (
            <div className="logo-text">
              🚀 ShellGate
            </div>
          )}
          {collapsed && (
            <div className="logo-icon">
              🚀
            </div>
          )}
        </div>

        {/* 侧边栏内容区域 */}
        <div style={{
          height: 'calc(100% - 80px)', // 调整高度以适应新的logo
          display: 'flex',
          flexDirection: 'column',
          background: 'transparent',
          color: 'var(--color-sidebar-text)',
        }}>
          {!collapsed ? (
            <>
              {/* 导航菜单区域 */}
              <div style={{
                padding: '16px 8px',
                borderBottom: `1px solid var(--color-sidebar-border)`
              }}>
                <Menu
                  className="modern-menu"
                  mode="inline"
                  selectedKeys={getSelectedKey()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-sidebar-text)',
                  }}
                  items={[
                    {
                      key: 'dashboard',
                      icon: <CloudServerOutlined style={{ fontSize: '16px', color: 'var(--color-sidebar-text)' }} />,
                      label: <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-sidebar-text)' }}>服务器管理</span>,
                      onClick: () => navigate('/dashboard'),
                      style: { color: 'var(--color-sidebar-text)' },
                    },
                    {
                      key: 'history',
                      icon: <HistoryOutlined style={{ fontSize: '16px', color: 'var(--color-sidebar-text)' }} />,
                      label: <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-sidebar-text)' }}>命令历史</span>,
                      onClick: () => navigate('/history'),
                      style: { color: 'var(--color-sidebar-text)' },
                    },
                    {
                      key: 'favorites',
                      icon: <StarOutlined style={{ fontSize: '16px', color: 'var(--color-sidebar-text)' }} />,
                      label: <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-sidebar-text)' }}>收藏命令</span>,
                      style: { color: 'var(--color-sidebar-text)' },
                    },
                    {
                      key: 'settings',
                      icon: <SettingOutlined style={{ fontSize: '16px', color: 'var(--color-sidebar-text)' }} />,
                      label: <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-sidebar-text)' }}>系统设置</span>,
                      onClick: () => navigate('/settings'),
                      style: { color: 'var(--color-sidebar-text)' },
                    },
                  ]}
                />
              </div>

              {/* 服务器管理区域 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* 服务器区域标题和添加按钮 */}
                <div className="server-list-header">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}>
                      🖥️ 服务器列表
                    </span>
                    <Button
                      className="modern-btn modern-btn-primary"
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={handleAddConnection}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        fontWeight: '500'
                      }}
                      title="添加服务器"
                    >
                      添加
                    </Button>
                  </div>
                </div>

                {/* 服务器列表 */}
                <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Spin size="small" style={{ color: 'white' }} />
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        marginTop: '8px'
                      }}>
                        加载中...
                      </div>
                    </div>
                  ) : connections.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: '1px dashed rgba(255, 255, 255, 0.2)',
                      margin: '8px'
                    }}>
                      <DatabaseOutlined style={{
                        fontSize: '32px',
                        marginBottom: '12px',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }} />
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>暂无服务器</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                        点击上方"添加"按钮创建第一个连接
                      </div>
                    </div>
                  ) : (
                    <div>
                      {connections.map((connection) => (
                        <div
                          key={connection.id}
                          className="server-item"
                          onClick={() => handleConnect(connection)}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="server-name">
                              <DatabaseOutlined style={{
                                marginRight: '8px',
                                color: '#4ade80',
                                fontSize: '14px'
                              }} />
                              {connection.name}
                            </div>
                            <div className="server-info">
                              📡 {connection.host}:{connection.port} • {connection.protocol.toUpperCase()}
                            </div>
                            {connection.description && (
                              <div style={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '10px',
                                marginTop: '2px',
                                fontStyle: 'italic'
                              }}>
                                {connection.description}
                              </div>
                            )}
                          </div>
                          <div className="server-actions" style={{ display: 'flex', gap: '6px' }}>
                            <Tooltip title="快速连接" placement="top">
                              <Button
                                type="text"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConnect(connection);
                                }}
                                style={{
                                  color: '#4ade80',
                                  width: '28px',
                                  height: '28px',
                                  minWidth: '28px',
                                  borderRadius: '6px',
                                  background: 'rgba(74, 222, 128, 0.1)',
                                  border: '1px solid rgba(74, 222, 128, 0.2)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="编辑配置" placement="top">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditConnection(connection);
                                }}
                                style={{
                                  color: '#60a5fa',
                                  width: '28px',
                                  height: '28px',
                                  minWidth: '28px',
                                  borderRadius: '6px',
                                  background: 'rgba(96, 165, 250, 0.1)',
                                  border: '1px solid rgba(96, 165, 250, 0.2)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="删除服务器" placement="top">
                              <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  Modal.confirm({
                                    title: '确认删除',
                                    content: `确定要删除服务器 "${connection.name}" 吗？`,
                                    okText: '删除',
                                    cancelText: '取消',
                                    okType: 'danger',
                                    onOk: () => handleDeleteConnection(connection.id),
                                  });
                                }}
                                style={{
                                  color: '#f87171',
                                  width: '28px',
                                  height: '28px',
                                  minWidth: '28px',
                                  borderRadius: '6px',
                                  background: 'rgba(248, 113, 113, 0.1)',
                                  border: '1px solid rgba(248, 113, 113, 0.2)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)';
                                  e.currentTarget.style.transform = 'scale(1)';
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
          className={themeMode === 'dark' ? 'modern-header-dark' : 'modern-header'}
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '64px',
            background: 'var(--color-header-bg)',
            borderBottom: `1px solid var(--color-header-border)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Button
            className="header-toggle-btn"
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '18px',
              width: 48,
              height: 48,
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              transition: 'var(--transition-fast)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* 主题选择器 */}
            <ThemeSelector size="small" showText={false} />

            {/* 用户信息下拉菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div
                className="user-dropdown"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'var(--transition-fast)',
                  background: 'var(--color-surface-hover)',
                  border: `1px solid var(--color-border)`,
                }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{
                    background: 'var(--color-primary)',
                    border: `2px solid var(--color-border)`,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  size={32}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    lineHeight: '1.2',
                    color: 'var(--color-text-primary)',
                  }}>
                    {user?.username || '管理员'}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    opacity: 0.7,
                    lineHeight: '1.2',
                    color: 'var(--color-text-secondary)',
                  }}>
                    系统管理员
                  </span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          className={`main-content ${themeMode === 'dark' ? 'main-content-dark' : ''}`}
          style={{
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--color-bg-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* 现代化添加/编辑服务器模态框 */}
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            <DatabaseOutlined />
            {editingConnection ? '🔧 编辑服务器配置' : '➕ 添加新服务器'}
          </div>
        }
        open={isModalVisible}
        onOk={handleSaveConnection}
        onCancel={() => setIsModalVisible(false)}
        okText="💾 保存配置"
        cancelText="❌ 取消"
        width={520}
        centered
        okButtonProps={{
          className: 'modern-btn modern-btn-primary',
          style: { height: '40px', fontWeight: '500' }
        }}
        cancelButtonProps={{
          style: { height: '40px', fontWeight: '500' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            protocol: 'ssh',
            port: 22,
          }}
          style={{ padding: '8px 0' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span style={{ fontWeight: '500' }}>🏷️ 服务器名称</span>}
              name="name"
              rules={[{ required: true, message: '请输入服务器名称' }]}
            >
              <Input
                placeholder="例如：生产服务器01"
                style={{ height: '40px' }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: '500' }}>🌐 协议类型</span>}
              name="protocol"
              rules={[{ required: true, message: '请选择协议' }]}
            >
              <Select style={{ height: '40px' }}>
                <Select.Option value="ssh">🔐 SSH (推荐)</Select.Option>
                <Select.Option value="telnet">📡 Telnet</Select.Option>
                <Select.Option value="rdp">🖥️ RDP</Select.Option>
                <Select.Option value="vnc">👁️ VNC</Select.Option>
                <Select.Option value="sftp">📁 SFTP</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Form.Item
              label={<span style={{ fontWeight: '500' }}>🖥️ 主机地址</span>}
              name="host"
              rules={[{ required: true, message: '请输入主机地址' }]}
            >
              <Input
                placeholder="例如：192.168.1.100 或 server.example.com"
                style={{ height: '40px' }}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: '500' }}>🔌 端口号</span>}
              name="port"
              rules={[{ required: true, message: '请输入端口号' }]}
            >
              <Input
                type="number"
                placeholder="22"
                style={{ height: '40px' }}
              />
            </Form.Item>
          </div>

          <Form.Item
            label={<span style={{ fontWeight: '500' }}>👤 用户名</span>}
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              placeholder="例如：root, admin, ubuntu"
              style={{ height: '40px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '500' }}>📝 描述信息</span>}
            name="description"
          >
            <Input.TextArea
              placeholder="可选：添加一些备注信息，如服务器用途、环境等..."
              rows={3}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainLayout;
