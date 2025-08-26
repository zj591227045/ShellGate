import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Spin, message } from 'antd';
import { websocketService } from '../../services/websocketService';
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
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 创建终端实例
    terminal.current = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
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
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      tabStopWidth: 4,
    });

    // 添加插件
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(new WebLinksAddon());
    terminal.current.loadAddon(new SearchAddon());

    // 挂载到 DOM
    terminal.current.open(terminalRef.current);

    // 调整大小
    fitAddon.current.fit();

    // 显示连接信息
    terminal.current.writeln(`\x1b[36m正在连接到 ${connection.name} (${connection.host}:${connection.port})...\x1b[0m`);

    // 监听用户输入
    terminal.current.onData((data) => {
      if (isConnected) {
        websocketService.sendTerminalInput(sessionId, data);
      }
    });

    // 监听终端大小变化
    terminal.current.onResize((size) => {
      if (isConnected) {
        websocketService.resizeTerminal(sessionId, size);
      }
    });

    // 设置 WebSocket 事件监听
    const handleTerminalOutput = (data: any) => {
      if (data.sessionId === sessionId && terminal.current) {
        terminal.current.write(data.output);
      }
    };

    const handleShellReady = (data: any) => {
      if (data.sessionId === sessionId) {
        setIsConnecting(false);
        setIsConnected(true);
        terminal.current?.writeln('\x1b[32m✅ 连接成功！\x1b[0m');

        // 发送终端大小
        if (fitAddon.current) {
          const size = fitAddon.current.proposeDimensions();
          if (size) {
            websocketService.resizeTerminal(sessionId, size);
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
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      websocketService.off('terminal-output', handleTerminalOutput);
      websocketService.off('shell-ready', handleShellReady);
      websocketService.off('session-error', handleSessionError);
      websocketService.off('session-disconnected', handleSessionDisconnected);

      window.removeEventListener('resize', handleResize);

      if (terminal.current) {
        terminal.current.dispose();
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

  return (
    <div style={{
      height: '100%',
      position: 'relative',
      backgroundColor: '#1e1e1e'
    }}>
      {isConnecting && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          textAlign: 'center'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            正在连接到 {connection.name}...
          </div>
        </div>
      )}

      <div
        ref={terminalRef}
        style={{
          height: '100%',
          width: '100%',
          padding: '8px'
        }}
      />
    </div>
  );
};

export default TerminalComponent;
