import axios from 'axios';

interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  description?: string;
  tags?: string[];
}

interface CreateConnectionData {
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  password?: string;
  privateKey?: string;
  description?: string;
  tags?: string[];
}

interface UpdateConnectionData extends Partial<CreateConnectionData> {}

class ConnectionService {
  async getConnections(): Promise<Connection[]> {
    try {
      const response = await axios.get('/connections');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取连接列表失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async getConnection(id: string): Promise<Connection> {
    try {
      const response = await axios.get(`/connections/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取连接信息失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async createConnection(data: CreateConnectionData): Promise<Connection> {
    try {
      const response = await axios.post('/connections', data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '创建连接失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async updateConnection(id: string, data: UpdateConnectionData): Promise<Connection> {
    try {
      const response = await axios.put(`/connections/${id}`, data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '更新连接失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async deleteConnection(id: string): Promise<void> {
    try {
      const response = await axios.delete(`/connections/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || '删除连接失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async testConnection(id: string, password?: string): Promise<{ success: boolean; message: string; latency?: number }> {
    try {
      const response = await axios.post(`/connections/${id}/test`, { password });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '连接测试失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }
}

export const connectionService = new ConnectionService();
