import React from 'react';
import { List, Tag, Button, Tooltip, Spin } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  description?: string;
}

interface ServerListProps {
  connections: Connection[];
  onConnect: (connection: Connection) => void;
  activeConnections: string[];
  connectingIds?: string[];
}

const protocolColors = {
  ssh: 'blue',
  telnet: 'green', 
  rdp: 'orange',
  vnc: 'purple',
  sftp: 'cyan'
};

const ServerList: React.FC<ServerListProps> = ({
  connections,
  onConnect,
  activeConnections,
  connectingIds = []
}) => {
  const { theme } = useTheme();

  return (
    <div className="server-list" style={{ background: theme.colors.surface }}>
      <List
        dataSource={connections}
        style={{ background: 'transparent' }}
        renderItem={(connection) => {
          const isActive = activeConnections.includes(connection.id);
          const isConnecting = connectingIds.includes(connection.id);

          return (
            <List.Item
              className={`connection-item ${isActive ? 'active' : ''}`}
              style={{
                background: isActive ? theme.colors.primary : theme.colors.surface,
                color: isActive ? 'white' : theme.colors.text,
                border: `1px solid ${isActive ? theme.colors.primary : theme.colors.borderLight}`,
                borderRadius: '8px',
                margin: '8px 12px',
                padding: '12px 16px',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                boxShadow: isActive ? theme.antdTheme.token.boxShadow : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = theme.colors.surfaceElevated;
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = theme.antdTheme.token.boxShadowSecondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = theme.colors.surface;
                  e.currentTarget.style.borderColor = theme.colors.borderLight;
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
              onClick={() => onConnect(connection)}
              actions={[
                <Tooltip title={isConnecting ? '连接中...' : (isActive ? '断开连接' : '连接')}>
                  <Button
                    type="text"
                    size="small"
                    icon={
                      isConnecting ? (
                        <Spin
                          indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />}
                          size="small"
                        />
                      ) : isActive ? (
                        <StopOutlined />
                      ) : (
                        <PlayCircleOutlined />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isConnecting) {
                        onConnect(connection);
                      }
                    }}
                    disabled={isConnecting}
                    style={{
                      color: isActive ? 'white' : (isConnecting ? theme.colors.textDisabled : theme.colors.success),
                    }}
                  />
                </Tooltip>,
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: isActive ? 'white' : theme.colors.textSecondary,
                    }}
                  />
                </Tooltip>,
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: isActive ? 'white' : theme.colors.error,
                    }}
                  />
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      className="connection-name"
                      style={{
                        color: isActive ? 'white' : theme.colors.text,
                        fontWeight: 500,
                        fontSize: '14px',
                      }}
                    >
                      {connection.name}
                    </span>
                    <Tag
                      color={isActive ? 'rgba(255,255,255,0.2)' : protocolColors[connection.protocol]}
                      style={{
                        color: isActive ? 'white' : undefined,
                        border: isActive ? '1px solid rgba(255,255,255,0.3)' : undefined,
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      {connection.protocol.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <div className="connection-info">
                    <div style={{
                      color: isActive ? 'rgba(255,255,255,0.9)' : theme.colors.textSecondary,
                      fontSize: '13px',
                      marginTop: '4px',
                    }}>
                      {connection.username}@{connection.host}:{connection.port}
                    </div>
                    {connection.description && (
                      <div style={{
                        marginTop: 6,
                        fontSize: '12px',
                        color: isActive ? 'rgba(255,255,255,0.7)' : theme.colors.textDisabled,
                        lineHeight: '1.4',
                      }}>
                        {connection.description}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
};

export default ServerList;
