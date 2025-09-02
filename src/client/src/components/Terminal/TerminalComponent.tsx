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
    // 临时强制使用深色主题进行调试
    if (true || themeMode === 'dark') {
      return {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#3e3e3e',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      };
    } else {
      return {
        background: '#ffffff',
        foreground: '#333333',
        cursor: '#333333',
        cursorAccent: '#ffffff',
        selectionBackground: '#b3d4fc',
        black: '#000000',
        red: '#cd3131',
        green: '#00bc00',
        yellow: '#949800',
        blue: '#0451a5',
        magenta: '#bc05bc',
        cyan: '#0598bc',
        white: '#555555',
        brightBlack: '#666666',
        brightRed: '#cd3131',
        brightGreen: '#14ce14',
        brightYellow: '#b5ba00',
        brightBlue: '#0451a5',
        brightMagenta: '#bc05bc',
        brightCyan: '#0598bc',
        brightWhite: '#a5a5a5',
      };
    }
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
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        tabStopWidth: 4,
        cols: 80,
        rows: 24,
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

      // 调整大小和强制刷新
      setTimeout(() => {
        if (fitAddon.current && terminal.current && terminalRef.current) {
          try {
            fitAddon.current.fit();
            // 强制刷新终端显示
            terminal.current.refresh(0, terminal.current.rows - 1);
            console.log('🔄 终端已调整大小并刷新');
          } catch (error) {
            console.warn('Terminal fit failed:', error);
          }
        }
      }, 100);

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

        // 确保终端获得焦点
        setTimeout(() => {
          if (terminal.current && terminalRef.current) {
            terminal.current.focus();
            console.log('🎯 终端已获得焦点');

            // 测试写入一些内容
            terminal.current.write('🔧 测试终端是否工作...\r\n');

            // 检查终端 DOM 结构
            const terminalElement = terminalRef.current.querySelector('.xterm');
            console.log('🔍 终端 DOM 检查:', {
              hasTerminalElement: !!terminalElement,
              terminalRefChildren: terminalRef.current.children.length,
              terminalRefHTML: terminalRef.current.innerHTML.substring(0, 200)
            });
          }
        }, 100);
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
    <div style={{
      height: '100%',
      minHeight: '400px',
      position: 'relative',
      backgroundColor: terminalTheme.background,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '6px',
      overflow: 'hidden',
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
          height: '100%',
          width: '100%',
          minHeight: '400px',
          minWidth: '600px',
          padding: '8px',
          backgroundColor: terminalTheme.background,
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
};

export default TerminalComponent;
