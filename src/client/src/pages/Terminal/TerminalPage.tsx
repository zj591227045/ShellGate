import React, { useState, useEffect } from 'react';
import { Layout, Tabs, Empty, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TerminalComponent from '../../components/Terminal/TerminalComponent';
import { connectionService } from '../../services/connectionService';
import { websocketService } from '../../services/websocketService';

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
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    // 连接 WebSocket
    websocketService.connect();

    // 监听会话事件
    websocketService.on('session-created', (data) => {
      message.success(`会话创建成功: ${data.sessionId}`);
    });

    websocketService.on('session-disconnected', (data) => {
      message.info(`会话已断开: ${data.sessionId}`);
      setActiveSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
    });

    websocketService.on('session-error', (data) => {
      message.error(`会话错误: ${data.error}`);
    });

    return () => {
      websocketService.disconnect();
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
        justifyContent: 'center' 
      }}>
        <Empty 
          description="暂无活动会话"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Content>
    );
  }

  return (
    <Content style={{ height: '100%', padding: 0 }}>
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
        style={{ height: '100%' }}
        tabBarStyle={{ margin: 0, paddingLeft: 16 }}
      />
    </Content>
  );
};

export default TerminalPage;
