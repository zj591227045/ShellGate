import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Empty, message, Card } from 'antd';
import { PlusOutlined, CloudServerOutlined } from '@ant-design/icons';
import TerminalComponent from '../../components/Terminal/TerminalComponent';
import { connectionService } from '../../services/connectionService';
import { websocketService } from '../../services/websocketService';
import { useTheme } from '../../contexts/ThemeContext';

const { Content } = Layout;

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  description?: string;
}

interface ActiveSession {
  sessionId: string;
  connectionId: string;
  connection: Connection;
}

const TerminalPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    // 连接 WebSocket
    if (!websocketService.isSocketConnected()) {
      websocketService.connect();
    }

    // 监听会话事件
    websocketService.on('session-created', (data: any) => {
      message.success(`会话创建成功: ${data.sessionId}`);
    });

    websocketService.on('session-disconnected', (data: any) => {
      message.info(`会话已断开: ${data.sessionId}`);
      setActiveSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
    });

    websocketService.on('session-error', (data: any) => {
      message.error(`会话错误: ${data.error}`);
    });

    return () => {
      // 清理事件监听器
      websocketService.removeAllListeners();
    };
  }, []);

  const handleCreateSession = async (connection: Connection) => {
    try {
      const sessionId = await websocketService.createSession(connection.id);
      
      const newSession: ActiveSession = {
        sessionId,
        connectionId: connection.id,
        connection,
      };

      setActiveSessions(prev => [...prev, newSession]);
      setActiveKey(sessionId);
    } catch (error) {
      message.error('创建会话失败');
    }
  };

  const handleCloseSession = (sessionId: string) => {
    websocketService.disconnectSession(sessionId);
    setActiveSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    
    // 如果关闭的是当前活动标签，切换到其他标签
    if (activeKey === sessionId) {
      const remainingSessions = activeSessions.filter(s => s.sessionId !== sessionId);
      setActiveKey(remainingSessions.length > 0 ? remainingSessions[0].sessionId : '');
    }
  };

  const tabItems = activeSessions.map(session => ({
    key: session.sessionId,
    label: (
      <span>
        {session.connection.name}
        <PlusOutlined 
          style={{ marginLeft: 8, fontSize: 12 }}
          onClick={(e) => {
            e.stopPropagation();
            handleCloseSession(session.sessionId);
          }}
        />
      </span>
    ),
    children: (
      <TerminalComponent 
        sessionId={session.sessionId}
        connection={session.connection}
      />
    ),
  }));

  if (activeSessions.length === 0) {
    return (
      <Content style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.background,
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
              color: theme.colors.textSecondary,
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
            暂无活动终端会话
          </h2>
          <p style={{
            color: theme.colors.textSecondary,
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '0',
          }}>
            请前往服务器页面选择一个连接来开始终端会话
          </p>
        </Card>
      </Content>
    );
  }

  return (
    <Content style={{
      height: '100vh',
      padding: 0,
      background: theme.colors.background,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeKey}
        onChange={setActiveKey}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            handleCloseSession(targetKey as string);
          }
        }}
        items={tabItems}
        style={{
          height: '100%',
          background: theme.colors.surface,
          display: 'flex',
          flexDirection: 'column',
        }}
        tabBarStyle={{
          margin: 0,
          paddingLeft: 16,
          background: theme.colors.surface,
          borderBottom: `1px solid ${theme.colors.border}`,
          flexShrink: 0,
        }}
      />
    </Content>
  );
};

export default TerminalPage;
