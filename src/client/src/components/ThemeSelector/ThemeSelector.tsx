import React from 'react';
import { Dropdown, Button, Space, Typography } from 'antd';
import { BgColorsOutlined, CheckOutlined } from '@ant-design/icons';
import { useTheme, ThemeMode, AVAILABLE_THEMES } from '../../contexts/ThemeContext';

const { Text } = Typography;

interface ThemeSelectorProps {
  size?: 'small' | 'middle' | 'large';
  showText?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  size = 'middle', 
  showText = true 
}) => {
  const { themeMode, setThemeMode, availableThemes } = useTheme();

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const currentTheme = availableThemes.find(t => t.key === themeMode);

  const menuItems = availableThemes.map(theme => ({
    key: theme.key,
    label: (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 4px',
          minWidth: '200px',
        }}
        onClick={() => handleThemeChange(theme.key)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: getThemePreviewColor(theme.key),
              border: '2px solid var(--color-border)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ 
              fontWeight: 500, 
              color: 'var(--color-text-primary)',
              fontSize: '14px',
            }}>
              {theme.name}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--color-text-secondary)',
              marginTop: '2px',
            }}>
              {theme.description}
            </div>
          </div>
        </div>
        {themeMode === theme.key && (
          <CheckOutlined style={{ 
            color: 'var(--color-primary)', 
            fontSize: '14px' 
          }} />
        )}
      </div>
    ),
  }));

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
      overlayStyle={{
        minWidth: '240px',
      }}
    >
      <Button
        size={size}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
      >
        <BgColorsOutlined />
        {showText && (
          <Space size={4}>
            <Text style={{ color: 'var(--color-text-primary)' }}>
              主题
            </Text>
            <Text style={{ color: 'var(--color-text-secondary)' }}>
              {currentTheme?.name}
            </Text>
          </Space>
        )}
      </Button>
    </Dropdown>
  );
};

// 获取主题预览颜色
function getThemePreviewColor(themeKey: ThemeMode): string {
  switch (themeKey) {
    case 'light':
      return 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    case 'dark':
      return 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
    case 'ocean':
      return 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
    case 'forest':
      return 'linear-gradient(135deg, #059669 0%, #047857 100%)';
    case 'deep-ocean':
      return 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)';
    default:
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
}

export default ThemeSelector;
