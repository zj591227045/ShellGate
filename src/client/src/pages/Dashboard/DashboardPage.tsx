import React, { useState, useEffect } from 'react';
import { message, Card, Tabs, Modal } from 'antd';
import { CloudServerOutlined } from '@ant-design/icons';
import TerminalComponent from '../../components/Terminal/TerminalComponent';
import { useTheme } from '../../contexts/ThemeContext';
import { connectionService } from '../../services/connectionService';
import { websocketService } from '../../services/websocketService';
import { useLocation } from 'react-router-dom';
import { PageTransition, FadeIn } from '../../components/AnimatedComponents';
import { DragDropTabs, useDragDropTabs, DragDropTabItem, TabContextMenuActions } from '../../components/DragAndDrop';
import { useKeyboardShortcuts, SHORTCUTS, KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

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

  const handleConnect = async (connection: Connection, allowDuplicate: boolean = false) => {
    // 检查是否已经有该连接的终端标签页（除非明确允许重复）
    if (!allowDuplicate) {
      const existingTab = terminalTabs.find(tab => tab.connectionId === connection.id);
      if (existingTab) {
        setActiveTabKey(existingTab.key);
        message.info(`${connection.name} 已经连接`);
        return;
      }
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
          websocketService.once('connect_error', (error: any) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      }

      // 创建SSH会话
      const sessionId = await websocketService.createSession(connection.id);

      // 创建新的终端标签页
      const existingCount = terminalTabs.filter(tab => tab.connectionId === connection.id).length;
      const tabLabel = existingCount > 0 ? `${connection.name} (${existingCount + 1})` : connection.name;

      const newTab: TerminalTab = {
        key: `terminal-${connection.id}-${Date.now()}`,
        label: tabLabel,
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



  const handleCloseTab = (targetKey: string, showConfirm: boolean = false) => {
    const targetTab = terminalTabs.find(tab => tab.key === targetKey);
    if (!targetTab) return;

    const doClose = () => {
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
    };

    if (showConfirm) {
      Modal.confirm({
        title: '确认关闭',
        content: `确定要关闭终端 "${targetTab.label}" 吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: doClose,
      });
    } else {
      doClose();
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
  };

  // 右键菜单处理函数
  const handleDisconnect = (tabKey: string) => {
    const targetTab = terminalTabs.find(tab => tab.key === tabKey);
    if (targetTab) {
      websocketService.disconnectSession(targetTab.sessionId);

      // 断开连接后关闭标签
      handleCloseTab(tabKey);

      message.success(`已断开 ${targetTab.label} 的连接`);
    }
  };

  const handleReconnect = async (tabKey: string) => {
    const targetTab = terminalTabs.find(tab => tab.key === tabKey);
    if (targetTab) {
      const connection = connections.find(conn => conn.id === targetTab.connectionId);
      if (connection) {
        try {
          message.loading(`正在重新连接到 ${connection.name}...`, 0);

          // 先断开现有连接
          websocketService.disconnectSession(targetTab.sessionId);

          // 等待一段时间让服务器处理断开请求
          await new Promise(resolve => setTimeout(resolve, 500));

          // 重新创建会话
          const newSessionId = await websocketService.createSession(connection.id);

          // 更新标签页的会话ID
          setTerminalTabs(tabs => tabs.map(tab =>
            tab.key === tabKey ? { ...tab, sessionId: newSessionId } : tab
          ));

          message.destroy(); // 清除loading消息
          message.success(`已重新连接到 ${connection.name}`);
        } catch (error) {
          message.destroy(); // 清除loading消息
          console.error('重新连接失败:', error);
          message.error(`重新连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    }
  };

  const handleDuplicate = async (tabKey: string) => {
    const targetTab = terminalTabs.find(tab => tab.key === tabKey);
    if (targetTab) {
      const connection = connections.find(conn => conn.id === targetTab.connectionId);
      if (connection) {
        console.log('复制标签 - 目标连接:', connection);
        console.log('当前标签数量:', terminalTabs.length);
        try {
          await handleConnect(connection, true); // 允许重复连接
          console.log('复制标签完成 - 新标签数量:', terminalTabs.length);
        } catch (error) {
          console.error('复制标签失败:', error);
          message.error(`复制标签失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    }
  };

  const handleCloseOthers = (tabKey: string) => {
    const targetTab = terminalTabs.find(tab => tab.key === tabKey);
    if (!targetTab) return;

    const otherTabs = terminalTabs.filter(tab => tab.key !== tabKey);
    if (otherTabs.length === 0) {
      message.info('没有其他标签页需要关闭');
      return;
    }

    Modal.confirm({
      title: '确认关闭其他标签',
      content: `确定要关闭除 "${targetTab.label}" 外的其他 ${otherTabs.length} 个标签页吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 关闭其他所有标签页的会话
        otherTabs.forEach(tab => {
          websocketService.disconnectSession(tab.sessionId);
        });

        // 只保留目标标签页
        setTerminalTabs([targetTab]);
        setActiveTabKey(targetTab.key);

        message.success('已关闭其他标签页');
      },
    });
  };

  const handleCloseAll = () => {
    if (terminalTabs.length === 0) {
      message.info('没有标签页需要关闭');
      return;
    }

    Modal.confirm({
      title: '确认关闭所有标签',
      content: `确定要关闭所有 ${terminalTabs.length} 个标签页吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        // 关闭所有会话
        terminalTabs.forEach(tab => {
          websocketService.disconnectSession(tab.sessionId);
        });

        // 清空所有标签页
        setTerminalTabs([]);
        setActiveTabKey('');

        message.success('已关闭所有标签页');
      },
    });
  };

  // 键盘快捷键定义
  const shortcuts: KeyboardShortcut[] = [
    {
      ...SHORTCUTS.CLOSE_TAB,
      action: () => {
        if (activeTabKey && terminalTabs.length > 0) {
          handleCloseTab(activeTabKey);
        }
      },
      description: '关闭当前标签页',
    },
    {
      ...SHORTCUTS.NEXT_TAB,
      action: () => {
        if (terminalTabs.length > 1) {
          const currentIndex = terminalTabs.findIndex(tab => tab.key === activeTabKey);
          const nextIndex = (currentIndex + 1) % terminalTabs.length;
          setActiveTabKey(terminalTabs[nextIndex].key);
        }
      },
      description: '切换到下一个标签页',
    },
    {
      ...SHORTCUTS.PREV_TAB,
      action: () => {
        if (terminalTabs.length > 1) {
          const currentIndex = terminalTabs.findIndex(tab => tab.key === activeTabKey);
          const prevIndex = currentIndex === 0 ? terminalTabs.length - 1 : currentIndex - 1;
          setActiveTabKey(terminalTabs[prevIndex].key);
        }
      },
      description: '切换到上一个标签页',
    },
    {
      key: '1',
      ctrl: true,
      action: () => {
        if (terminalTabs.length >= 1) {
          setActiveTabKey(terminalTabs[0].key);
        }
      },
      description: '切换到第1个标签页',
    },
    {
      key: '2',
      ctrl: true,
      action: () => {
        if (terminalTabs.length >= 2) {
          setActiveTabKey(terminalTabs[1].key);
        }
      },
      description: '切换到第2个标签页',
    },
    {
      key: '3',
      ctrl: true,
      action: () => {
        if (terminalTabs.length >= 3) {
          setActiveTabKey(terminalTabs[2].key);
        }
      },
      description: '切换到第3个标签页',
    },
    {
      key: '4',
      ctrl: true,
      action: () => {
        if (terminalTabs.length >= 4) {
          setActiveTabKey(terminalTabs[3].key);
        }
      },
      description: '切换到第4个标签页',
    },
    {
      key: '5',
      ctrl: true,
      action: () => {
        if (terminalTabs.length >= 5) {
          setActiveTabKey(terminalTabs[4].key);
        }
      },
      description: '切换到第5个标签页',
    },
  ];

  // 启用键盘快捷键
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  return (
    <PageTransition>
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
              <DragDropTabs
                type="editable-card"
                activeKey={activeTabKey}
                onChange={handleTabChange}
                onEdit={(targetKey, action) => {
                  if (action === 'remove') {
                    handleCloseTab(targetKey as string, true); // 点击X按钮时显示确认提示
                  }
                }}
                items={terminalTabs.map(tab => ({
                  key: tab.key,
                  label: tab.label,
                  closable: true,
                }))}
                onReorder={(newItems) => {
                  // 重新排序终端标签页
                  const reorderedTabs = newItems.map(item =>
                    terminalTabs.find(tab => tab.key === item.key)!
                  ).filter(Boolean);
                  setTerminalTabs(reorderedTabs);
                }}
                enableDrag={true}
                enableContextMenu={true}
                contextMenuActions={{
                  onDisconnect: handleDisconnect,
                  onReconnect: handleReconnect,
                  onDuplicate: handleDuplicate,
                  onCloseOthers: handleCloseOthers,
                  onCloseAll: handleCloseAll,
                }}
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
              minHeight: 'calc(100vh - 64px - 32px)', // 视口高度减去头部和内边距
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
    </PageTransition>
  );
};

export default DashboardPage;
