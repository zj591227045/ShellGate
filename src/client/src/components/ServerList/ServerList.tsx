import React from 'react';
import { List, Tag, Button, Tooltip, Spin, message } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  DeleteOutlined,
  LoadingOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import { ContextMenu, ContextMenuItem } from '../ContextMenu';
import { ListItemAnimation, HoverAnimation } from '../AnimatedComponents';

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
  onEdit?: (connection: Connection) => void;
  onDelete?: (connection: Connection) => void;
  onDuplicate?: (connection: Connection) => void;
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
  connectingIds = [],
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const { theme } = useTheme();

  const handleCopyConnectionInfo = (connection: Connection) => {
    const info = `${connection.username}@${connection.host}:${connection.port}`;
    navigator.clipboard.writeText(info).then(() => {
      message.success('连接信息已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const getContextMenuItems = (connection: Connection): ContextMenuItem[] => {
    const isActive = activeConnections.includes(connection.id);
    const isConnecting = connectingIds.includes(connection.id);

    return [
      {
        key: 'connect',
        label: isActive ? '断开连接' : '连接',
        icon: isActive ? <StopOutlined /> : <PlayCircleOutlined />,
        disabled: isConnecting,
        onClick: () => onConnect(connection),
      },
      {
        key: 'divider1',
        label: '-',
        disabled: true,
      },
      {
        key: 'edit',
        label: '编辑连接',
        icon: <EditOutlined />,
        onClick: () => onEdit?.(connection),
      },
      {
        key: 'duplicate',
        label: '复制连接',
        icon: <CopyOutlined />,
        onClick: () => onDuplicate?.(connection),
      },
      {
        key: 'copy-info',
        label: '复制连接信息',
        icon: <CopyOutlined />,
        onClick: () => handleCopyConnectionInfo(connection),
      },
      {
        key: 'divider2',
        label: '-',
        disabled: true,
      },
      {
        key: 'delete',
        label: '删除连接',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => onDelete?.(connection),
      },
    ].filter(item => item.label !== '-' || !item.disabled); // 过滤掉分隔符
  };

  return (
    <div className="server-list" style={{ background: theme.colors.surface }}>
      <List
        dataSource={connections}
        style={{ background: 'transparent' }}
        renderItem={(connection, index) => {
          const isActive = activeConnections.includes(connection.id);
          const isConnecting = connectingIds.includes(connection.id);

          return (
            <ListItemAnimation
              key={connection.id}
              index={index}
            >
              <ContextMenu
                items={getContextMenuItems(connection)}
              >
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
              </ContextMenu>
            </ListItemAnimation>
          );
        }}
      />
    </div>
  );
};

export default ServerList;
