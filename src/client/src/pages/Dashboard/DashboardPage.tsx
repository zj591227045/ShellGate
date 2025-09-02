import React, { useState, useEffect } from 'react';
import { message, Card, Tabs } from 'antd';
import { CloudServerOutlined } from '@ant-design/icons';
import TerminalComponent from '../../components/Terminal/TerminalComponent';
import { useTheme } from '../../contexts/ThemeContext';
import { connectionService } from '../../services/connectionService';
import { websocketService } from '../../services/websocketService';
import { useLocation } from 'react-router-dom';

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
  const [terminalTabs, setTerminalTabs] = useState<TerminalTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('');
  const routerLocation = useLocation();

  // 获取连接列表
  const fetchConnections = async () => {
    try {
      const data = await connectionService.getConnections();
      setConnections(data);
    } catch (error) {
      console.error('获取连接列表失败:', error);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchConnections();
  }, []);

  // 处理从菜单传递的自动连接参数
  useEffect(() => {
    const state = routerLocation.state as { autoConnect?: Connection } | null;
    if (state?.autoConnect && connections.length > 0) {
      const connection = connections.find(conn => conn.id === state.autoConnect!.id);
      if (connection) {
        handleConnect(connection);
        // 清除state，避免重复连接
        window.history.replaceState({}, document.title);
      }
    }
  }, [routerLocation, connections]);

  const handleConnect = async (connection: Connection) => {
    // 检查是否已经有该连接的终端标签页
    const existingTab = terminalTabs.find(tab => tab.connectionId === connection.id);
    if (existingTab) {
      setActiveTabKey(existingTab.key);
      message.info(`${connection.name} 已经连接`);
      return;
    }

    try {
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

      // 创建SSH会话
      const sessionId = await websocketService.createSession(connection.id);

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

      message.destroy();
      message.success(`已连接到 ${connection.name}`);

    } catch (error) {
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

  return (
    <>
      <div style={{
        height: '100%',
        background: theme.colors.background,
        display: 'flex',
        flexDirection: 'column',
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
                请从左侧服务器列表点击连接按钮，直接在此处打开终端
              </p>
            </Card>
          </div>
        ) : (
          // 有终端时显示终端区域
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
              background: theme.colors.background,
              position: 'relative',
              padding: '16px',
              minHeight: '400px',
              overflow: 'hidden',
            }}>
              {terminalTabs.map(tab => {
                const connection = connections.find(conn => conn.id === tab.connectionId);
                if (!connection) return null;

                return (
                  <div
                    key={tab.key}
                    style={{
                      display: activeTabKey === tab.key ? 'block' : 'none',
                      height: 'calc(100% - 32px)',
                      width: 'calc(100% - 32px)',
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      right: '16px',
                      bottom: '16px',
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
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
