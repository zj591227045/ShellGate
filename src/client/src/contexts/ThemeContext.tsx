import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { theme as antdTheme } from 'antd';

export type ThemeMode = 'light' | 'dark' | 'ocean' | 'forest' | 'deep-ocean';

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

// 可用主题配置
export const AVAILABLE_THEMES = [
  { key: 'light' as ThemeMode, name: '浅色', description: '经典浅色主题', isDark: false },
  { key: 'dark' as ThemeMode, name: '深色', description: '专业深色主题', isDark: true },
  { key: 'ocean' as ThemeMode, name: '海洋', description: '清新蓝色主题', isDark: false },
  { key: 'forest' as ThemeMode, name: '森林', description: '自然绿色主题', isDark: false },
  { key: 'deep-ocean' as ThemeMode, name: '深海', description: '深邃蓝色主题', isDark: true },
];

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
    primary: '#818cf8',
    primaryHover: '#6366f1',
    primaryActive: '#4f46e5',
    secondary: '#8E9297',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    border: '#334155',
    borderLight: '#475569',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textDisabled: '#94a3b8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
  },
  antdTheme: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#818cf8',
      colorBgContainer: '#1e293b',
      colorBgElevated: '#334155',
      colorBgLayout: '#0f172a',
      colorBorder: '#334155',
      colorBorderSecondary: '#475569',
      colorText: '#f1f5f9',
      colorTextSecondary: '#cbd5e1',
      colorTextTertiary: '#94a3b8',
      colorTextQuaternary: '#64748b',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      boxShadowSecondary: '0 1px 4px rgba(0, 0, 0, 0.2)',
    },
  },
};

// 海洋主题
const oceanTheme: ThemeConfig = {
  mode: 'ocean',
  colors: {
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    primaryActive: '#0369a1',
    secondary: '#64748b',
    background: '#f0f9ff',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    border: '#bae6fd',
    borderLight: '#e0f2fe',
    text: '#0c4a6e',
    textSecondary: '#0369a1',
    textDisabled: '#0284c7',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0ea5e9',
  },
  antdTheme: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#0ea5e9',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f0f9ff',
      colorBorder: '#bae6fd',
      colorBorderSecondary: '#e0f2fe',
      colorText: '#0c4a6e',
      colorTextSecondary: '#0369a1',
      colorTextTertiary: '#0284c7',
      colorTextQuaternary: '#0891b2',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(14, 165, 233, 0.1)',
      boxShadowSecondary: '0 1px 4px rgba(14, 165, 233, 0.08)',
    },
  },
};

// 森林主题
const forestTheme: ThemeConfig = {
  mode: 'forest',
  colors: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryActive: '#065f46',
    secondary: '#64748b',
    background: '#f0fdf4',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    border: '#bbf7d0',
    borderLight: '#dcfce7',
    text: '#14532d',
    textSecondary: '#166534',
    textDisabled: '#15803d',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#3b82f6',
  },
  antdTheme: {
    algorithm: antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#059669',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#f0fdf4',
      colorBorder: '#bbf7d0',
      colorBorderSecondary: '#dcfce7',
      colorText: '#14532d',
      colorTextSecondary: '#166534',
      colorTextTertiary: '#15803d',
      colorTextQuaternary: '#16a34a',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.1)',
      boxShadowSecondary: '0 1px 4px rgba(5, 150, 105, 0.08)',
    },
  },
};

// 深海主题
const deepOceanTheme: ThemeConfig = {
  mode: 'deep-ocean',
  colors: {
    primary: '#38bdf8',
    primaryHover: '#0ea5e9',
    primaryActive: '#0284c7',
    secondary: '#8E9297',
    background: '#0c1426',
    surface: '#1e293b',
    surfaceElevated: '#334155',
    border: '#334155',
    borderLight: '#475569',
    text: '#e2e8f0',
    textSecondary: '#cbd5e1',
    textDisabled: '#94a3b8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#38bdf8',
  },
  antdTheme: {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#38bdf8',
      colorBgContainer: '#1e293b',
      colorBgElevated: '#334155',
      colorBgLayout: '#0c1426',
      colorBorder: '#334155',
      colorBorderSecondary: '#475569',
      colorText: '#e2e8f0',
      colorTextSecondary: '#cbd5e1',
      colorTextTertiary: '#94a3b8',
      colorTextQuaternary: '#64748b',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(56, 189, 248, 0.2)',
      boxShadowSecondary: '0 1px 4px rgba(56, 189, 248, 0.15)',
    },
  },
};

// 主题映射
const THEME_MAP: Record<ThemeMode, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  'deep-ocean': deepOceanTheme,
};

interface ThemeContextType {
  theme: ThemeConfig;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  availableThemes: typeof AVAILABLE_THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // 从 localStorage 读取保存的主题，默认为 light
    const savedTheme = localStorage.getItem('shellgate-theme') as ThemeMode;
    return savedTheme && THEME_MAP[savedTheme] ? savedTheme : 'light';
  });

  const theme = THEME_MAP[themeMode];

  const toggleTheme = () => {
    const currentIndex = AVAILABLE_THEMES.findIndex(t => t.key === themeMode);
    const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
    setThemeMode(AVAILABLE_THEMES[nextIndex].key);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    if (THEME_MAP[mode]) {
      setThemeMode(mode);
    }
  };

  // 保存主题到 localStorage 并应用CSS变量
  useEffect(() => {
    localStorage.setItem('shellgate-theme', themeMode);

    // 设置 data-theme 属性到 html 元素
    document.documentElement.setAttribute('data-theme', themeMode);

    // 更新 CSS 变量（兼容旧代码）
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
    availableThemes: AVAILABLE_THEMES,
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
