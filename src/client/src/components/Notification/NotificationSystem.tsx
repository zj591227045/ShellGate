import React, { createContext, useContext, useState, useCallback } from 'react';
import { notification } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined,
  BellOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import './NotificationSystem.css';

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    text: string;
    onClick: () => void;
  };
  timestamp: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<NotificationItem>) => string;
  showError: (title: string, message?: string, options?: Partial<NotificationItem>) => string;
  showWarning: (title: string, message?: string, options?: Partial<NotificationItem>) => string;
  showInfo: (title: string, message?: string, options?: Partial<NotificationItem>) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  defaultDuration = 4000,
  position = 'topRight',
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = useCallback((notificationData: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const id = generateId();
    const newNotification: NotificationItem = {
      ...notificationData,
      id,
      timestamp: Date.now(),
      duration: notificationData.duration ?? defaultDuration,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // 限制通知数量
      return updated.slice(0, maxNotifications);
    });

    // 自动移除通知（除非是持久化通知）
    if (!newNotification.persistent && newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<NotificationItem>) => {
    return addNotification({ type: 'success', title, message, ...options });
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, options?: Partial<NotificationItem>) => {
    return addNotification({ type: 'error', title, message, ...options });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<NotificationItem>) => {
    return addNotification({ type: 'warning', title, message, ...options });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<NotificationItem>) => {
    return addNotification({ type: 'info', title, message, ...options });
  }, [addNotification]);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer notifications={notifications} position={position} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: NotificationItem[];
  position: string;
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  position,
  onRemove,
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'topLeft':
        return { top: 24, left: 24 };
      case 'topRight':
        return { top: 24, right: 24 };
      case 'bottomLeft':
        return { bottom: 24, left: 24 };
      case 'bottomRight':
        return { bottom: 24, right: 24 };
      default:
        return { top: 24, right: 24 };
    }
  };

  return (
    <div 
      className={`notification-container ${position}`}
      style={getPositionStyles()}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface NotificationCardProps {
  notification: NotificationItem;
  onRemove: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onRemove,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const handleRemove = () => {
    onRemove(notification.id);
  };

  return (
    <motion.div
      className={`notification-card ${notification.type}`}
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      layout
    >
      <div className="notification-content">
        <div className="notification-icon">
          {getIcon()}
        </div>
        <div className="notification-text">
          <div className="notification-title">{notification.title}</div>
          {notification.message && (
            <div className="notification-message">{notification.message}</div>
          )}
        </div>
      </div>
      
      <div className="notification-actions">
        {notification.action && (
          <button
            className="notification-action-btn"
            onClick={notification.action.onClick}
          >
            {notification.action.text}
          </button>
        )}
        <button
          className="notification-close-btn"
          onClick={handleRemove}
          aria-label="关闭通知"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

// 便捷的全局通知函数（使用 Ant Design 的 notification API）
export const globalNotification = {
  success: (title: string, message?: string) => {
    notification.success({
      message: title,
      description: message,
      placement: 'topRight',
      duration: 4,
    });
  },
  error: (title: string, message?: string) => {
    notification.error({
      message: title,
      description: message,
      placement: 'topRight',
      duration: 6,
    });
  },
  warning: (title: string, message?: string) => {
    notification.warning({
      message: title,
      description: message,
      placement: 'topRight',
      duration: 5,
    });
  },
  info: (title: string, message?: string) => {
    notification.info({
      message: title,
      description: message,
      placement: 'topRight',
      duration: 4,
    });
  },
};
