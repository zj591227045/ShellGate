import axios from 'axios';

interface CommandLog {
  id: string;
  command: string;
  output?: string;
  timestamp: Date;
  duration?: number;
  sessionId: string;
}

interface FavoriteCommand {
  id: string;
  name: string;
  command: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
}

interface CreateFavoriteData {
  name: string;
  command: string;
  description?: string;
  tags?: string[];
}

interface UpdateFavoriteData extends Partial<CreateFavoriteData> {}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class CommandService {
  async getHistory(params: PaginationParams = {}): Promise<PaginatedResponse<CommandLog>> {
    try {
      const response = await axios.get('/commands/history', { params });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取命令历史失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async searchHistory(query: string, params: PaginationParams = {}): Promise<PaginatedResponse<CommandLog>> {
    try {
      const response = await axios.get('/commands/history/search', { 
        params: { q: query, ...params }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '搜索命令历史失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async getFavorites(): Promise<FavoriteCommand[]> {
    try {
      const response = await axios.get('/commands/favorites');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取收藏命令失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async addFavorite(data: CreateFavoriteData): Promise<FavoriteCommand> {
    try {
      const response = await axios.post('/commands/favorites', data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '添加收藏命令失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async updateFavorite(id: string, data: UpdateFavoriteData): Promise<FavoriteCommand> {
    try {
      const response = await axios.put(`/commands/favorites/${id}`, data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '更新收藏命令失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async deleteFavorite(id: string): Promise<void> {
    try {
      const response = await axios.delete(`/commands/favorites/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || '删除收藏命令失败');
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

export const commandService = new CommandService();
