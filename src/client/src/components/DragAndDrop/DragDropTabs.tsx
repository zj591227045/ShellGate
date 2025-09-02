import React, { useState, useRef } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { motion, Reorder } from 'framer-motion';
import './DragDropTabs.css';

export interface DragDropTabItem {
  key: string;
  label: React.ReactNode;
  children?: React.ReactNode;
  closable?: boolean;
  disabled?: boolean;
}

interface DragDropTabsProps extends Omit<TabsProps, 'items' | 'onEdit'> {
  items: DragDropTabItem[];
  onReorder?: (newItems: DragDropTabItem[]) => void;
  onEdit?: (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => void;
  enableDrag?: boolean;
}

export const DragDropTabs: React.FC<DragDropTabsProps> = ({
  items,
  onReorder,
  onEdit,
  enableDrag = true,
  ...tabsProps
}) => {
  const [draggedItems, setDraggedItems] = useState(items);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // 当外部items变化时，同步更新内部状态
  React.useEffect(() => {
    setDraggedItems(items);
  }, [items]);

  const handleReorder = (newItems: DragDropTabItem[]) => {
    setDraggedItems(newItems);
    onReorder?.(newItems);
  };

  const handleDragStart = (event: React.DragEvent, item: DragDropTabItem) => {
    if (!enableDrag) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    
    // 设置拖拽数据
    event.dataTransfer.setData('text/plain', item.key);
    event.dataTransfer.effectAllowed = 'move';
    
    // 创建自定义拖拽图像
    const dragImage = document.createElement('div');
    dragImage.textContent = typeof item.label === 'string' ? item.label : item.key;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: #1890ff;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 50, 20);
    
    // 清理临时元素
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleDragOver = (event: React.DragEvent) => {
    if (!enableDrag) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent, targetItem: DragDropTabItem) => {
    if (!enableDrag) return;
    
    event.preventDefault();
    const draggedKey = event.dataTransfer.getData('text/plain');
    
    if (draggedKey === targetItem.key) return;
    
    const draggedIndex = draggedItems.findIndex(item => item.key === draggedKey);
    const targetIndex = draggedItems.findIndex(item => item.key === targetItem.key);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newItems = [...draggedItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    
    handleReorder(newItems);
  };

  // 转换为Ant Design Tabs所需的格式
  const antdItems = draggedItems.map((item, index) => ({
    key: item.key,
    label: enableDrag ? (
      <div
        draggable={!item.disabled}
        onDragStart={(e) => handleDragStart(e, item)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, item)}
        className={`drag-tab-label ${isDragging ? 'dragging' : ''} ${item.disabled ? 'disabled' : ''}`}
        style={{
          cursor: item.disabled ? 'not-allowed' : 'grab',
          userSelect: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'all 0.2s ease',
        }}
      >
        {item.label}
      </div>
    ) : item.label,
    children: item.children,
    closable: item.closable,
    disabled: item.disabled,
  }));

  return (
    <div className={`drag-drop-tabs ${isDragging ? 'is-dragging' : ''}`}>
      <Tabs
        {...tabsProps}
        items={antdItems}
        onEdit={onEdit}
        className={`${tabsProps.className || ''} ${enableDrag ? 'draggable-tabs' : ''}`}
      />
    </div>
  );
};

// Hook for managing draggable tab state
export const useDragDropTabs = (initialItems: DragDropTabItem[]) => {
  const [items, setItems] = useState(initialItems);
  const [activeKey, setActiveKey] = useState<string>(initialItems[0]?.key || '');

  const addTab = (newTab: DragDropTabItem) => {
    setItems(prev => [...prev, newTab]);
    setActiveKey(newTab.key);
  };

  const removeTab = (targetKey: string) => {
    const newItems = items.filter(item => item.key !== targetKey);
    setItems(newItems);
    
    // 如果删除的是当前活跃标签，切换到相邻标签
    if (activeKey === targetKey && newItems.length > 0) {
      const targetIndex = items.findIndex(item => item.key === targetKey);
      const newActiveIndex = Math.min(targetIndex, newItems.length - 1);
      setActiveKey(newItems[newActiveIndex].key);
    }
  };

  const reorderTabs = (newItems: DragDropTabItem[]) => {
    setItems(newItems);
  };

  const updateTab = (key: string, updates: Partial<DragDropTabItem>) => {
    setItems(prev => prev.map(item => 
      item.key === key ? { ...item, ...updates } : item
    ));
  };

  return {
    items,
    activeKey,
    setActiveKey,
    addTab,
    removeTab,
    reorderTabs,
    updateTab,
    setItems,
  };
};
