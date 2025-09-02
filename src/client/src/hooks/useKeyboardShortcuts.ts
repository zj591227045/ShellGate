import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
  preventDefault = true,
  stopPropagation = true,
}: UseKeyboardShortcutsOptions) => {
  const shortcutsRef = useRef(shortcuts);
  
  // 更新快捷键引用
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;
    
    // 检查是否在输入框中
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
    
    // 在输入框中时，只处理特定的快捷键
    if (isInputElement && !ctrlKey && !metaKey && !altKey) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.disabled) continue;

      const keyMatch = shortcut.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === ctrlKey;
      const altMatch = !!shortcut.alt === altKey;
      const shiftMatch = !!shortcut.shift === shiftKey;
      const metaMatch = !!shortcut.meta === metaKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) event.stopPropagation();
        
        shortcut.action();
        break;
      }
    }
  }, [enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

// 预定义的快捷键组合
export const SHORTCUTS = {
  NEW_TAB: { key: 't', ctrl: true },
  CLOSE_TAB: { key: 'w', ctrl: true },
  NEXT_TAB: { key: 'Tab', ctrl: true },
  PREV_TAB: { key: 'Tab', ctrl: true, shift: true },
  REFRESH: { key: 'r', ctrl: true },
  FIND: { key: 'f', ctrl: true },
  SAVE: { key: 's', ctrl: true },
  COPY: { key: 'c', ctrl: true },
  PASTE: { key: 'v', ctrl: true },
  SELECT_ALL: { key: 'a', ctrl: true },
  UNDO: { key: 'z', ctrl: true },
  REDO: { key: 'y', ctrl: true },
  ZOOM_IN: { key: '=', ctrl: true },
  ZOOM_OUT: { key: '-', ctrl: true },
  ZOOM_RESET: { key: '0', ctrl: true },
  TOGGLE_FULLSCREEN: { key: 'F11' },
  ESCAPE: { key: 'Escape' },
  ENTER: { key: 'Enter' },
  DELETE: { key: 'Delete' },
  BACKSPACE: { key: 'Backspace' },
} as const;

// 格式化快捷键显示文本
export const formatShortcut = (shortcut: Partial<KeyboardShortcut>): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.meta) parts.push('Cmd');
  
  if (shortcut.key) {
    let keyDisplay = shortcut.key;
    
    // 特殊键名映射
    const keyMap: Record<string, string> = {
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Escape': 'Esc',
      'Delete': 'Del',
      'Backspace': '⌫',
      'Enter': '⏎',
      'Tab': '⇥',
      ' ': 'Space',
    };
    
    keyDisplay = keyMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(keyDisplay);
  }
  
  return parts.join(' + ');
};

// 检查快捷键冲突
export const hasShortcutConflict = (
  shortcut1: Partial<KeyboardShortcut>,
  shortcut2: Partial<KeyboardShortcut>
): boolean => {
  return (
    shortcut1.key?.toLowerCase() === shortcut2.key?.toLowerCase() &&
    !!shortcut1.ctrl === !!shortcut2.ctrl &&
    !!shortcut1.alt === !!shortcut2.alt &&
    !!shortcut1.shift === !!shortcut2.shift &&
    !!shortcut1.meta === !!shortcut2.meta
  );
};

// 验证快捷键是否有效
export const isValidShortcut = (shortcut: Partial<KeyboardShortcut>): boolean => {
  if (!shortcut.key) return false;
  
  // 检查是否有修饰键
  const hasModifier = shortcut.ctrl || shortcut.alt || shortcut.shift || shortcut.meta;
  
  // 功能键和特殊键可以不需要修饰键
  const specialKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Escape', 'Tab', 'Enter', 'Delete', 'Backspace'];
  const isSpecialKey = specialKeys.includes(shortcut.key);
  
  return hasModifier || isSpecialKey;
};

// 创建快捷键帮助文本
export const createShortcutHelp = (shortcuts: KeyboardShortcut[]): string => {
  return shortcuts
    .filter(s => !s.disabled)
    .map(s => `${formatShortcut(s)}: ${s.description}`)
    .join('\n');
};
