import React, { useState, useEffect, useRef } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import './ContextMenu.css';

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: React.ReactNode;
  disabled?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  items, 
  children, 
  disabled = false 
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;
    setPosition({ x: clientX, y: clientY });
    setVisible(true);
  };

  const handleClick = () => {
    setVisible(false);
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const findMenuItem = (items: ContextMenuItem[], targetKey: string): ContextMenuItem | null => {
      for (const item of items) {
        if (item.key === targetKey) {
          return item;
        }
        if (item.children) {
          const found = findMenuItem(item.children, targetKey);
          if (found) return found;
        }
      }
      return null;
    };

    const menuItem = findMenuItem(items, key);
    if (menuItem?.onClick) {
      menuItem.onClick();
    }
    setVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setVisible(false);
      }
    };

    const handleScroll = () => {
      setVisible(false);
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('wheel', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('wheel', handleScroll, true);
    };
  }, [visible]);

  // 调整菜单位置以防止超出视窗
  useEffect(() => {
    if (visible && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // 防止菜单超出右边界
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      // 防止菜单超出下边界
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      // 防止菜单超出左边界
      if (x < 0) {
        x = 10;
      }

      // 防止菜单超出上边界
      if (y < 0) {
        y = 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [visible, position]);

  const convertToAntdItems = (items: ContextMenuItem[]): MenuProps['items'] => {
    return items.map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      disabled: item.disabled,
      danger: item.danger,
      children: item.children ? convertToAntdItems(item.children) : undefined,
    }));
  };

  return (
    <>
      <div
        ref={containerRef}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={menuRef}
          className="context-menu-overlay"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
          }}
        >
          <Menu
            items={convertToAntdItems(items)}
            onClick={handleMenuClick}
            style={{
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
            }}
          />
        </div>
      )}
    </>
  );
};
