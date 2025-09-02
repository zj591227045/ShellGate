import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { theme as antdTheme } from 'antd';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  antdTheme: any;
}

// 默认主题（灰蓝色系）
const lightTheme: ThemeConfig = {
  mode: 'light',
  colors: {
    primary: '#4A90E2',
    primaryHover: '#357ABD',
    primaryActive: '#2E6DA4',
    secondary: '#6C757D',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E9ECEF',
    borderLight: '#F1F3F4',
    text: '#212529',
    textSecondary: '#6C757D',
    textDisabled: '#ADB5BD',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
  },
  antdTheme: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#4A90E2',
      colorBgContainer: '#FFFFFF',
      colorBgElevated: '#FFFFFF',
      colorBgLayout: '#F8F9FA',
      colorBorder: '#E9ECEF',
      colorBorderSecondary: '#F1F3F4',
      colorText: '#212529',
      colorTextSecondary: '#6C757D',
      colorTextTertiary: '#ADB5BD',
      colorTextQuaternary: '#CED4DA',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.08)',
    },
  },
};

// 夜间主题
const darkTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    primary: '#5B9BD5',
    primaryHover: '#7BB3E0',
    primaryActive: '#4A8BC2',
    secondary: '#8E9297',
    background: '#1A1A1A',
    surface: '#2D2D2D',
    surfaceElevated: '#3A3A3A',
    border: '#404040',
    borderLight: '#333333',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textDisabled: '#666666',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: '#1890FF',
  },
  antdTheme: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#5B9BD5',
      colorBgContainer: '#2D2D2D',
      colorBgElevated: '#3A3A3A',
      colorBgLayout: '#1A1A1A',
      colorBorder: '#404040',
      colorBorderSecondary: '#333333',
      colorText: '#FFFFFF',
      colorTextSecondary: '#B0B0B0',
      colorTextTertiary: '#666666',
      colorTextQuaternary: '#4A4A4A',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.2)',
    },
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // 从 localStorage 读取保存的主题，默认为 light
    const savedTheme = localStorage.getItem('shellgate-theme') as ThemeMode;
    return savedTheme || 'light';
  });

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  // 保存主题到 localStorage
  useEffect(() => {
    localStorage.setItem('shellgate-theme', themeMode);
    
    // 更新 CSS 变量
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // 更新 body 的背景色
    document.body.style.backgroundColor = theme.colors.background;
  }, [themeMode, theme]);

  const value: ThemeContextType = {
    theme,
    themeMode,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
