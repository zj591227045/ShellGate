import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface RefreshResponse {
  token: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    // 设置 axios 默认配置
    axios.defaults.baseURL = API_BASE_URL;
    
    // 请求拦截器：添加认证头
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器：处理认证错误
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储
          this.setToken(null);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '登录失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    }
  }

  async refreshToken(token: string): Promise<RefreshResponse> {
    try {
      const response = await axios.post('/auth/refresh', { token });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Token 刷新失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get('/auth/me');

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '获取用户信息失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await axios.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || '密码修改失败');
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

export const authService = new AuthService();
