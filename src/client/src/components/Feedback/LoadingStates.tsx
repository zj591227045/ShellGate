import React from 'react';
import { Spin, Progress, Button } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import './LoadingStates.css';

// 基础加载组件
interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip,
  spinning = true,
  children,
  className = '',
}) => {
  const customIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />;

  return (
    <div className={`loading-spinner ${className}`}>
      <Spin 
        indicator={customIcon} 
        size={size} 
        tip={tip} 
        spinning={spinning}
      >
        {children}
      </Spin>
    </div>
  );
};

// 进度条加载组件
interface ProgressLoaderProps {
  percent: number;
  status?: 'normal' | 'exception' | 'success';
  showInfo?: boolean;
  strokeColor?: string;
  trailColor?: string;
  size?: 'default' | 'small';
  format?: (percent?: number) => React.ReactNode;
  className?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
  percent,
  status = 'normal',
  showInfo = true,
  strokeColor,
  trailColor,
  size = 'default',
  format,
  className = '',
}) => {
  return (
    <motion.div
      className={`progress-loader ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Progress
        percent={percent}
        status={status}
        showInfo={showInfo}
        strokeColor={strokeColor}
        trailColor={trailColor}
        size={size}
        format={format}
      />
    </motion.div>
  );
};

// 骨架屏加载组件
interface SkeletonLoaderProps {
  lines?: number;
  avatar?: boolean;
  title?: boolean;
  active?: boolean;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  lines = 3,
  avatar = false,
  title = true,
  active = true,
  className = '',
}) => {
  return (
    <div className={`skeleton-loader ${className}`}>
      {avatar && (
        <div className="skeleton-avatar" />
      )}
      <div className="skeleton-content">
        {title && (
          <div className={`skeleton-title ${active ? 'active' : ''}`} />
        )}
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton-line ${active ? 'active' : ''}`}
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// 连接状态指示器
interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  message,
  showRetry = false,
  onRetry,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <LoadingOutlined spin />,
          color: '#1890ff',
          text: message || '正在连接...',
        };
      case 'connected':
        return {
          icon: <CheckCircleOutlined />,
          color: '#52c41a',
          text: message || '已连接',
        };
      case 'disconnected':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#faad14',
          text: message || '连接断开',
        };
      case 'error':
        return {
          icon: <ExclamationCircleOutlined />,
          color: '#ff4d4f',
          text: message || '连接失败',
        };
      default:
        return {
          icon: <LoadingOutlined />,
          color: '#d9d9d9',
          text: '未知状态',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      className={`connection-status ${status} ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="status-indicator">
        <span className="status-icon" style={{ color: config.color }}>
          {config.icon}
        </span>
        <span className="status-text">{config.text}</span>
      </div>
      {showRetry && (status === 'disconnected' || status === 'error') && (
        <Button
          type="link"
          size="small"
          onClick={onRetry}
          className="retry-button"
        >
          重试
        </Button>
      )}
    </motion.div>
  );
};

// 操作反馈组件
interface ActionFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  type,
  message,
  description,
  duration = 4000,
  onClose,
  action,
  className = '',
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return { icon: <CheckCircleOutlined />, color: '#52c41a' };
      case 'error':
        return { icon: <ExclamationCircleOutlined />, color: '#ff4d4f' };
      case 'warning':
        return { icon: <ExclamationCircleOutlined />, color: '#faad14' };
      case 'info':
        return { icon: <LoadingOutlined />, color: '#1890ff' };
      default:
        return { icon: <LoadingOutlined />, color: '#d9d9d9' };
    }
  };

  const config = getTypeConfig();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`action-feedback ${type} ${className}`}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="feedback-content">
            <span className="feedback-icon" style={{ color: config.color }}>
              {config.icon}
            </span>
            <div className="feedback-text">
              <div className="feedback-message">{message}</div>
              {description && (
                <div className="feedback-description">{description}</div>
              )}
            </div>
          </div>
          {action && (
            <Button
              type="link"
              size="small"
              onClick={action.onClick}
              className="feedback-action"
            >
              {action.text}
            </Button>
          )}
          <Button
            type="text"
            size="small"
            onClick={() => {
              setVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="feedback-close"
          >
            ×
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
