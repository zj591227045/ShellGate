import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// 页面切换动画变体
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

// 页面切换动画配置
const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className,
  style 
}) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// 淡入动画组件
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.6,
  className,
  style 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration, 
        delay,
        ease: [0.6, -0.05, 0.01, 0.99]
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// 滑入动画组件
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const SlideIn: React.FC<SlideInProps> = ({ 
  children, 
  direction = 'up',
  delay = 0, 
  duration = 0.6,
  className,
  style 
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -50, y: 0 };
      case 'right': return { x: 50, y: 0 };
      case 'up': return { x: 0, y: 50 };
      case 'down': return { x: 0, y: -50 };
      default: return { x: 0, y: 50 };
    }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...getInitialPosition()
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        duration, 
        delay,
        ease: [0.6, -0.05, 0.01, 0.99]
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// 缩放动画组件
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className,
  style 
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        scale: 0.8 
      }}
      animate={{ 
        opacity: 1, 
        scale: 1 
      }}
      transition={{ 
        duration, 
        delay,
        ease: [0.6, -0.05, 0.01, 0.99]
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// 列表项动画组件
interface ListItemAnimationProps {
  children: React.ReactNode;
  index: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ListItemAnimation: React.FC<ListItemAnimationProps> = ({ 
  children, 
  index,
  className,
  style 
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20,
        scale: 0.95
      }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: 1
      }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: [0.6, -0.05, 0.01, 0.99]
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};

// 悬浮动画组件
interface HoverAnimationProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const HoverAnimation: React.FC<HoverAnimationProps> = ({ 
  children, 
  scale = 1.05,
  className,
  style 
}) => {
  return (
    <motion.div
      whileHover={{
        scale,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: scale * 0.95,
        transition: { duration: 0.1 }
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};
