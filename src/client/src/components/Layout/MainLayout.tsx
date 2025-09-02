import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Switch } from 'antd';
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
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return ['dashboard'];
    if (path.includes('/terminal')) return ['terminal'];
    if (path.includes('/history')) return ['history'];
    if (path.includes('/settings')) return ['settings'];
    return ['dashboard'];
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <CloudServerOutlined />,
      label: '服务器',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'terminal',
      icon: <CloudServerOutlined />,
      label: '终端',
      onClick: () => navigate('/terminal'),
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
  ];

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
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={themeMode}
        style={{
          background: theme.colors.surface,
          borderRight: `1px solid ${theme.colors.border}`,
        }}
      >
        <div className="logo">
          {collapsed ? 'SG' : 'ShellGate'}
        </div>
        <Menu
          theme={themeMode}
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
          }}
        />
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
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
