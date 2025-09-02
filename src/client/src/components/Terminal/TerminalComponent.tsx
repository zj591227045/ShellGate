import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Spin, message } from 'antd';
import { websocketService } from '../../services/websocketService';
import { useTheme } from '../../contexts/ThemeContext';
import 'xterm/css/xterm.css';



interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
  username: string;
  description?: string;
}

interface TerminalComponentProps {
  sessionId: string;
  connection: Connection;
}

const TerminalComponent: React.FC<TerminalComponentProps> = ({
  sessionId,
  connection
}) => {
  const { theme, themeMode } = useTheme();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const pendingData = useRef<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // 根据主题模式获取终端主题配置
  const getTerminalTheme = () => {
    // 从CSS变量获取主题色彩
    const style = getComputedStyle(document.documentElement);
    const terminalBg = style.getPropertyValue('--color-terminal-bg').trim() ||
                      (themeMode === 'dark' ? '#0f172a' : '#ffffff');
    const terminalText = style.getPropertyValue('--color-terminal-text').trim() ||
                        (themeMode === 'dark' ? '#f1f5f9' : '#1e293b');
    const terminalCursor = style.getPropertyValue('--color-terminal-cursor').trim() ||
                          (themeMode === 'dark' ? '#34d399' : '#667eea');
    const terminalSelection = style.getPropertyValue('--color-terminal-selection').trim() ||
                             (themeMode === 'dark' ? 'rgba(129, 140, 248, 0.3)' : 'rgba(102, 126, 234, 0.2)');

    // 根据主题模式返回适配的颜色方案
    const isDarkTheme = ['dark', 'deep-ocean'].includes(themeMode);

    return {
      background: terminalBg,
      foreground: terminalText,
      cursor: terminalCursor,
      cursorAccent: isDarkTheme ? '#000000' : '#ffffff',
      selectionBackground: terminalSelection,
      // 标准颜色 - 根据主题调整
      black: isDarkTheme ? '#0f172a' : '#1e293b',
      red: '#ef4444',
      green: isDarkTheme ? '#34d399' : '#10b981',
      yellow: isDarkTheme ? '#fbbf24' : '#f59e0b',
      blue: isDarkTheme ? '#60a5fa' : '#3b82f6',
      magenta: isDarkTheme ? '#a78bfa' : '#8b5cf6',
      cyan: isDarkTheme ? '#22d3ee' : '#06b6d4',
      white: terminalText,
      // 亮色版本
      brightBlack: isDarkTheme ? '#475569' : '#64748b',
      brightRed: isDarkTheme ? '#f87171' : '#dc2626',
      brightGreen: isDarkTheme ? '#4ade80' : '#059669',
      brightYellow: isDarkTheme ? '#facc15' : '#d97706',
      brightBlue: isDarkTheme ? '#3b82f6' : '#2563eb',
      brightMagenta: isDarkTheme ? '#c084fc' : '#7c3aed',
      brightCyan: isDarkTheme ? '#06b6d4' : '#0891b2',
      brightWhite: isDarkTheme ? '#ffffff' : '#000000',
    };
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // 清理之前的终端实例
    if (terminal.current) {
      try {
        terminal.current.dispose();
        console.log('🧹 清理之前的终端实例');
      } catch (error) {
        console.warn('清理终端实例时出错:', error);
      }
      terminal.current = null;
    }

    // 清空 DOM 容器
    if (terminalRef.current) {
      terminalRef.current.innerHTML = '';
    }

    // 等待容器完全渲染
    const initTerminal = () => {
      if (!terminalRef.current) {
        console.warn('终端容器引用不存在');
        return;
      }

      // 检查容器尺寸
      const rect = terminalRef.current.getBoundingClientRect();
      console.log('🔍 终端容器尺寸:', rect);

      if (rect.width === 0 || rect.height === 0) {
        // 容器还没有尺寸，延迟初始化
        console.log('⏳ 容器尺寸为0，延迟初始化');
        setTimeout(initTerminal, 100);
        return;
      }

      // 确保容器有最小尺寸
      if (rect.width < 100 || rect.height < 100) {
        console.log('⏳ 容器尺寸太小，延迟初始化');
        setTimeout(initTerminal, 100);
        return;
      }

      // 创建终端实例
      terminal.current = new Terminal({
        theme: getTerminalTheme(),
        fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace',
        fontSize: 14,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 3000,
        tabStopWidth: 4,
        allowTransparency: true,
        convertEol: true,
        disableStdin: false,
        // 动态计算终端尺寸
        cols: Math.max(80, Math.floor((rect.width - 32) / 8.4)), // 8.4是大概的字符宽度
        rows: Math.max(24, Math.floor((rect.height - 32) / 19.6)), // 19.6是大概的行高
      });

      // 添加插件
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.loadAddon(new WebLinksAddon());
      terminal.current.loadAddon(new SearchAddon());

      // 挂载到 DOM - 使用 try-catch 捕获错误
      try {
        if (!terminalRef.current) {
          console.error('终端容器引用在挂载时丢失');
          return;
        }

        terminal.current.open(terminalRef.current);

        // 调试：检查终端是否正确挂载
        console.log('🔍 终端挂载状态:', {
          terminalElement: terminalRef.current,
          hasChildren: terminalRef.current?.children.length,
          terminalInstance: !!terminal.current,
        });
      } catch (error) {
        console.error('❌ 终端挂载失败:', error);
        // 清理失败的终端实例
        if (terminal.current) {
          try {
            terminal.current.dispose();
          } catch (disposeError) {
            console.warn('清理失败的终端实例时出错:', disposeError);
          }
          terminal.current = null;
        }
        return;
      }

      // 显示连接信息
      terminal.current.writeln(`\x1b[36m正在连接到 ${connection.name} (${connection.host}:${connection.port})...\x1b[0m`);

      // 调整大小和强制刷新 - 多次尝试确保正确适配
      const fitTerminal = () => {
        if (fitAddon.current && terminal.current && terminalRef.current) {
          try {
            const rect = terminalRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              fitAddon.current.fit();
              // 强制刷新终端显示
              terminal.current.refresh(0, terminal.current.rows - 1);
              console.log('🔄 终端已调整大小并刷新', {
                cols: terminal.current.cols,
                rows: terminal.current.rows,
                containerSize: { width: rect.width, height: rect.height }
              });
            }
          } catch (error) {
            console.warn('Terminal fit failed:', error);
          }
        }
      };

      // 多次尝试fit，确保终端正确适配
      setTimeout(fitTerminal, 50);
      setTimeout(fitTerminal, 150);
      setTimeout(fitTerminal, 300);

      console.log('✅ 终端初始化完成');

      // 写入所有缓存的数据
      if (pendingData.current.length > 0) {
        console.log(`📦 写入 ${pendingData.current.length} 条缓存数据`);
        pendingData.current.forEach(data => {
          terminal.current?.write(data);
        });
        pendingData.current = []; // 清空缓存
      }

      // 立即设置键盘监听器
      if (terminal.current) {
        console.log('⌨️ 设置键盘监听器');

        // 测试终端是否可以接收输入
        terminal.current.onData((data) => {
          console.log('⌨️ 键盘输入:', JSON.stringify(data));
          // 直接发送，不检查连接状态（因为能收到数据说明已连接）
          websocketService.sendTerminalInput(sessionId, data);
        });

        // 监听终端大小变化
        terminal.current.onResize((size) => {
          if (isConnected) {
            websocketService.resizeTerminal(sessionId, size);
          }
        });

        // 确保终端获得焦点和正确显示
        setTimeout(() => {
          if (terminal.current && terminalRef.current) {
            terminal.current.focus();
            console.log('🎯 终端已获得焦点');

            // 写入欢迎信息
            terminal.current.writeln('\x1b[36m╭─────────────────────────────────────────╮\x1b[0m');
            terminal.current.writeln('\x1b[36m│           ShellGate Terminal            │\x1b[0m');
            terminal.current.writeln('\x1b[36m╰─────────────────────────────────────────╯\x1b[0m');
            terminal.current.writeln('');

            // 检查终端 DOM 结构
            const terminalElement = terminalRef.current.querySelector('.xterm');
            const xtermScreen = terminalRef.current.querySelector('.xterm-screen');
            console.log('🔍 终端 DOM 检查:', {
              hasTerminalElement: !!terminalElement,
              hasXtermScreen: !!xtermScreen,
              terminalRefChildren: terminalRef.current.children.length,
              terminalSize: {
                cols: terminal.current.cols,
                rows: terminal.current.rows
              }
            });

            // 强制重新渲染
            if (fitAddon.current) {
              setTimeout(() => {
                fitAddon.current?.fit();
                terminal.current?.refresh(0, terminal.current.rows - 1);
              }, 100);
            }
          }
        }, 200);
      } else {
        console.error('❌ 终端实例不存在，无法设置键盘监听器');
      }
    };

    // 延迟初始化，确保容器已经渲染
    setTimeout(initTerminal, 50);

    // 设置 WebSocket 事件监听
    const handleTerminalOutput = (data: any) => {
      console.log('📥 收到终端输出:', { sessionId: data.sessionId, currentSessionId: sessionId, hasTerminal: !!terminal.current, dataLength: data.data?.length });
      if (data.sessionId === sessionId && data.data) {
        if (terminal.current) {
          console.log('✅ 直接写入终端数据:', JSON.stringify(data.data));
          terminal.current.write(data.data);
          // 强制刷新终端显示
          setTimeout(() => {
            if (terminal.current) {
              terminal.current.refresh(0, terminal.current.rows - 1);
            }
          }, 10);
        } else {
          console.log('📦 缓存终端数据，等待终端初始化');
          pendingData.current.push(data.data);
        }
      } else {
        console.warn('❌ 跳过终端数据:', {
          sessionMatch: data.sessionId === sessionId,
          hasTerminal: !!terminal.current,
          hasData: !!data.data
        });
      }
    };

    const handleShellReady = (data: any) => {
      if (data.sessionId === sessionId) {
        console.log('🚀 Shell 准备就绪，设置连接状态');
        setIsConnecting(false);
        setIsConnected(true);

        // 发送一个测试命令来验证连接
        setTimeout(() => {
          console.log('🧪 发送测试命令: echo "Terminal Ready"');
          websocketService.sendTerminalInput(sessionId, 'echo "Terminal Ready"\r');
        }, 500);

        // 发送终端大小
        if (fitAddon.current) {
          try {
            const size = fitAddon.current.proposeDimensions();
            if (size && size.cols && size.rows) {
              console.log('📏 发送终端大小:', size);
              websocketService.resizeTerminal(sessionId, size);
            }
          } catch (error) {
            console.warn('Failed to get terminal dimensions:', error);
          }
        }
      }
    };

    const handleSessionError = (data: any) => {
      if (data.sessionId === sessionId) {
        setIsConnecting(false);
        setIsConnected(false);
        terminal.current?.writeln(`\x1b[31m❌ 连接失败: ${data.error}\x1b[0m`);
        message.error(`连接失败: ${data.error}`);
      }
    };

    const handleSessionDisconnected = (data: any) => {
      if (data.sessionId === sessionId) {
        setIsConnected(false);
        terminal.current?.writeln('\x1b[33m🔌 连接已断开\x1b[0m');
        message.warning('连接已断开');
      }
    };

    // 注册事件监听器
    websocketService.on('terminal-output', handleTerminalOutput);
    websocketService.on('shell-ready', handleShellReady);
    websocketService.on('session-error', handleSessionError);
    websocketService.on('session-disconnected', handleSessionDisconnected);

    // 窗口大小变化时调整终端大小
    const handleResize = () => {
      if (fitAddon.current && terminal.current && terminalRef.current) {
        try {
          const rect = terminalRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fitAddon.current.fit();
          }
        } catch (error) {
          console.warn('Terminal resize failed:', error);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null;
    if (terminalRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(handleResize, 50);
      });
      resizeObserver.observe(terminalRef.current);
    }

    // 清理函数
    return () => {
      websocketService.off('terminal-output', handleTerminalOutput);
      websocketService.off('shell-ready', handleShellReady);
      websocketService.off('session-error', handleSessionError);
      websocketService.off('session-disconnected', handleSessionDisconnected);

      window.removeEventListener('resize', handleResize);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (terminal.current) {
        try {
          terminal.current.dispose();
          console.log('🧹 终端实例已清理');
        } catch (error) {
          console.warn('清理终端实例时出错:', error);
        }
        terminal.current = null;
      }

      if (fitAddon.current) {
        fitAddon.current = null;
      }

      // 清空DOM容器
      if (terminalRef.current) {
        try {
          terminalRef.current.innerHTML = '';
        } catch (error) {
          console.warn('清空终端容器时出错:', error);
        }
      }
    };
  }, [sessionId, connection, isConnected]);

  // 组件挂载后调整终端大小
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 当主题改变时更新终端主题
  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.theme = getTerminalTheme();
      console.log('🎨 终端主题已更新');
    }
  }, [themeMode]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      console.log('🧹 TerminalComponent 组件卸载，开始清理...');
      if (terminal.current) {
        try {
          terminal.current.dispose();
          console.log('✅ 终端实例已在组件卸载时清理');
        } catch (error) {
          console.warn('组件卸载时清理终端实例出错:', error);
        }
      }
    };
  }, []);

  const terminalTheme = getTerminalTheme();

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        backgroundColor: terminalTheme.background,
        display: 'flex',
        flexDirection: 'column',
      }}>
      {isConnecting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <Spin size="large" />
            <div style={{
              marginTop: 16,
              color: theme.colors.text,
              fontSize: '14px',
            }}>
              正在连接到 {connection.name}...
            </div>
          </div>
        </div>
      )}

      <div
        ref={terminalRef}
        style={{
          flex: 1,
          width: '100%',
          backgroundColor: terminalTheme.background,
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default TerminalComponent;
