import React from 'react';
import { List, Tag, Button, Tooltip } from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined,
  EditOutlined,
  DeleteOutlined 
} from '@ant-design/icons';

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
  activeConnections 
}) => {
  return (
    <div className="server-list">
      <List
        dataSource={connections}
        renderItem={(connection) => {
          const isActive = activeConnections.includes(connection.id);
          
          return (
            <List.Item
              className={`connection-item ${isActive ? 'active' : ''}`}
              actions={[
                <Tooltip title={isActive ? '断开连接' : '连接'}>
                  <Button
                    type="text"
                    size="small"
                    icon={isActive ? <StopOutlined /> : <PlayCircleOutlined />}
                    onClick={() => onConnect(connection)}
                    style={{ color: isActive ? '#ff4d4f' : '#52c41a' }}
                  />
                </Tooltip>,
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                  />
                </Tooltip>,
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                  />
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="connection-name">{connection.name}</span>
                    <Tag color={protocolColors[connection.protocol]}>
                      {connection.protocol.toUpperCase()}
                    </Tag>
                  </div>
                }
                description={
                  <div className="connection-info">
                    <div>{connection.username}@{connection.host}:{connection.port}</div>
                    {connection.description && (
                      <div style={{ marginTop: 4, fontSize: '11px' }}>
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
