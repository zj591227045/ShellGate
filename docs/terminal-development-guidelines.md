# 终端组件开发规范

## 概述
本文档总结了在开发 ShellGate 终端组件过程中遇到的问题和解决方案，为后续开发提供指导原则。

## 核心问题与解决方案

### 1. 终端重复初始化问题

**问题描述：**
- 终端组件在主题变化、连接状态变化时会重复初始化
- 导致事件监听器重复绑定，键盘输入异常
- 造成性能问题和用户体验下降

**解决方案：**
```tsx
// 添加初始化状态标志
const [terminalInitialized, setTerminalInitialized] = useState(false);

// 在 useEffect 中检查是否已初始化
useEffect(() => {
  if (!terminalRef.current || !themeReady || terminalInitialized) return;
  // ... 初始化逻辑
  setTerminalInitialized(true);
}, [sessionId, themeReady]); // 精简依赖项
```

**开发规范：**
- ✅ 使用状态标志防止重复初始化
- ✅ 精简 useEffect 依赖项，只包含必要的依赖
- ✅ 在组件卸载时清理所有资源

### 2. 主题加载时序问题

**问题描述：**
- 终端初始化时主题 CSS 变量可能未加载完成
- 导致获取到空值，使用错误的默认颜色
- 表现为黑色背景+黑色文字

**解决方案：**
```tsx
// 主题就绪检查
const [themeReady, setThemeReady] = useState(false);

useEffect(() => {
  const checkTheme = () => {
    const style = getComputedStyle(document.documentElement);
    const terminalBg = style.getPropertyValue('--color-terminal-bg').trim();
    const dataTheme = document.documentElement.getAttribute('data-theme');
    
    if (terminalBg && dataTheme) {
      setThemeReady(true);
    } else {
      setTimeout(checkTheme, 50);
    }
  };
  checkTheme();
}, [themeMode]);

// 多层颜色保护
if (!terminalTheme.background || terminalTheme.background === '') {
  terminalTheme.background = '#ffffff';
}
```

**开发规范：**
- ✅ 等待主题完全加载后再初始化终端
- ✅ 提供多层默认值保护
- ✅ 使用明确的颜色值，避免空值

### 3. 调试信息干扰问题

**问题描述：**
- 自动发送测试命令干扰用户操作
- 自动显示欢迎信息覆盖服务器输出
- 过多的调试日志影响性能和调试

**解决方案：**
```tsx
// 移除自动测试命令
// ❌ 错误做法
setTimeout(() => {
  websocketService.sendTerminalInput(sessionId, 'echo "Terminal Ready"\r');
}, 500);

// ✅ 正确做法：不发送任何自动命令

// 移除自动欢迎信息
// ❌ 错误做法
terminal.current.writeln('╭─────────────────╮');
terminal.current.writeln('│  ShellGate      │');
terminal.current.writeln('╰─────────────────╯');

// ✅ 正确做法：让服务器控制所有输出
```

**开发规范：**
- ✅ 终端连接后不发送任何自动命令
- ✅ 不在终端中写入任何自动信息
- ✅ 减少调试日志，只保留错误和警告
- ✅ 让服务器完全控制终端输出

### 4. 事件监听器管理问题

**问题描述：**
- 重复绑定事件监听器导致输入异常
- 组件卸载时未正确清理监听器
- 内存泄漏和性能问题

**解决方案：**
```tsx
// 正确的事件监听器管理
useEffect(() => {
  if (!terminal.current) return;
  
  // 绑定事件监听器
  const dataHandler = (data: string) => {
    websocketService.sendTerminalInput(sessionId, data);
  };
  
  terminal.current.onData(dataHandler);
  
  // 清理函数
  return () => {
    if (terminal.current) {
      terminal.current.dispose();
    }
  };
}, [sessionId]); // 明确的依赖项
```

**开发规范：**
- ✅ 每个 useEffect 都要有对应的清理函数
- ✅ 避免在循环或条件语句中绑定事件监听器
- ✅ 组件卸载时清理所有资源

## 最佳实践

### 1. 组件状态管理
```tsx
// 使用明确的状态标志
const [isConnecting, setIsConnecting] = useState(true);
const [isConnected, setIsConnected] = useState(false);
const [themeReady, setThemeReady] = useState(false);
const [terminalInitialized, setTerminalInitialized] = useState(false);
```

### 2. 错误处理
```tsx
// 提供降级方案
try {
  // 主要逻辑
} catch (error) {
  console.error('终端操作失败:', error);
  // 降级处理
}
```

### 3. 性能优化
```tsx
// 使用 useCallback 缓存函数
const handleData = useCallback((data: string) => {
  websocketService.sendTerminalInput(sessionId, data);
}, [sessionId]);

// 使用 useMemo 缓存计算结果
const terminalTheme = useMemo(() => getTerminalTheme(), [themeMode]);
```

### 4. 调试策略
```tsx
// 分级日志
console.error('❌ 严重错误');  // 只在生产环境显示
console.warn('⚠️ 警告信息');   // 开发和生产环境
console.log('ℹ️ 调试信息');    // 只在开发环境
```

## 禁止事项

### ❌ 绝对不要做的事情
1. **不要在终端连接后自动发送命令**
2. **不要在终端中自动写入欢迎信息**
3. **不要在 useEffect 中使用过多依赖项**
4. **不要忘记清理事件监听器和定时器**
5. **不要在生产环境输出调试日志**
6. **不要在组件重新渲染时重复初始化终端**

### ✅ 必须要做的事情
1. **等待主题加载完成后再初始化终端**
2. **提供多层默认值保护**
3. **使用状态标志防止重复初始化**
4. **正确管理事件监听器生命周期**
5. **在组件卸载时清理所有资源**
6. **让服务器完全控制终端输出**

## 测试检查清单

在提交代码前，请确保：

- [ ] 终端只初始化一次
- [ ] 主题切换后终端颜色正确
- [ ] 键盘输入正常工作
- [ ] 没有自动发送的命令或信息
- [ ] 组件卸载时没有内存泄漏
- [ ] 控制台没有多余的调试信息
- [ ] 多个标签页可以正常工作
- [ ] 中文输入法正常工作

## 版本历史

- v1.0.0 (2025-09-02): 初始版本，总结终端组件开发经验
