import { NodeSSH } from 'node-ssh';
import { EventEmitter } from 'events';
import { ServerConnection, TerminalSize } from '../../shared/types';

export interface SSHConnectionOptions {
  connection: ServerConnection;
  password?: string;
  privateKey?: string;
}

export class SSHAdapter extends EventEmitter {
  private ssh: NodeSSH;
  private shell: any;
  private isConnected: boolean = false;
  private connectionId: string;

  constructor(connectionId: string) {
    super();
    this.connectionId = connectionId;
    this.ssh = new NodeSSH();
  }

  async connect(options: SSHConnectionOptions): Promise<void> {
    try {
      const { connection, password, privateKey } = options;

      const sshConfig: any = {
        host: connection.host,
        port: connection.port,
        username: connection.username,
        readyTimeout: 30000,
        keepaliveInterval: 30000,
      };

      // 设置认证方式
      if (privateKey) {
        sshConfig.privateKey = privateKey;
      } else if (password) {
        sshConfig.password = password;
      } else if (connection.password) {
        sshConfig.password = connection.password;
      } else if (connection.privateKey) {
        sshConfig.privateKey = connection.privateKey;
      } else {
        throw new Error('需要提供密码或私钥');
      }

      // 建立 SSH 连接
      await this.ssh.connect(sshConfig);
      this.isConnected = true;

      this.emit('connected', {
        connectionId: this.connectionId,
        message: `已连接到 ${connection.host}:${connection.port}`
      });

      console.log(`✅ SSH 连接成功: ${connection.username}@${connection.host}:${connection.port}`);

    } catch (error) {
      this.isConnected = false;
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      
      this.emit('error', {
        connectionId: this.connectionId,
        error: errorMessage
      });

      throw new Error(`SSH 连接失败: ${errorMessage}`);
    }
  }

  async startShell(terminalSize?: TerminalSize): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SSH 连接未建立');
    }

    try {
      // 请求 shell
      this.shell = await this.ssh.requestShell({
        cols: terminalSize?.cols || 80,
        rows: terminalSize?.rows || 24,
        term: 'xterm-256color'
      });

      // 监听 shell 数据
      this.shell.on('data', (data: Buffer) => {
        this.emit('data', {
          connectionId: this.connectionId,
          data: data.toString()
        });
      });

      // 监听 shell 关闭
      this.shell.on('close', () => {
        this.emit('disconnected', {
          connectionId: this.connectionId,
          message: 'Shell 会话已关闭'
        });
      });

      // 监听 shell 错误
      this.shell.on('error', (error: Error) => {
        this.emit('error', {
          connectionId: this.connectionId,
          error: error.message
        });
      });

      this.emit('shell-ready', {
        connectionId: this.connectionId,
        message: 'Shell 会话已准备就绪'
      });

      console.log(`✅ SSH Shell 启动成功: ${this.connectionId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Shell 启动失败';
      
      this.emit('error', {
        connectionId: this.connectionId,
        error: errorMessage
      });

      throw new Error(`SSH Shell 启动失败: ${errorMessage}`);
    }
  }

  write(data: string): void {
    if (!this.shell) {
      throw new Error('Shell 未启动');
    }

    try {
      this.shell.write(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '写入失败';
      this.emit('error', {
        connectionId: this.connectionId,
        error: errorMessage
      });
    }
  }

  resize(terminalSize: TerminalSize): void {
    if (!this.shell) {
      throw new Error('Shell 未启动');
    }

    try {
      this.shell.setWindow(terminalSize.rows, terminalSize.cols);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '调整大小失败';
      this.emit('error', {
        connectionId: this.connectionId,
        error: errorMessage
      });
    }
  }

  async executeCommand(command: string): Promise<{ stdout: string; stderr: string; code: number }> {
    if (!this.isConnected) {
      throw new Error('SSH 连接未建立');
    }

    try {
      const result = await this.ssh.execCommand(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code || 0
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '命令执行失败';
      throw new Error(`命令执行失败: ${errorMessage}`);
    }
  }

  async uploadFile(localPath: string, remotePath: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SSH 连接未建立');
    }

    try {
      await this.ssh.putFile(localPath, remotePath);
      this.emit('file-uploaded', {
        connectionId: this.connectionId,
        localPath,
        remotePath
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件上传失败';
      throw new Error(`文件上传失败: ${errorMessage}`);
    }
  }

  async downloadFile(remotePath: string, localPath: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SSH 连接未建立');
    }

    try {
      await this.ssh.getFile(localPath, remotePath);
      this.emit('file-downloaded', {
        connectionId: this.connectionId,
        remotePath,
        localPath
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件下载失败';
      throw new Error(`文件下载失败: ${errorMessage}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.shell) {
        this.shell.end();
        this.shell = null;
      }

      if (this.isConnected) {
        this.ssh.dispose();
        this.isConnected = false;
      }

      this.emit('disconnected', {
        connectionId: this.connectionId,
        message: 'SSH 连接已断开'
      });

      console.log(`✅ SSH 连接已断开: ${this.connectionId}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '断开连接失败';
      console.error(`❌ SSH 断开连接失败: ${errorMessage}`);
    }
  }

  getConnectionStatus(): { connected: boolean; hasShell: boolean } {
    return {
      connected: this.isConnected,
      hasShell: !!this.shell
    };
  }

  getConnectionId(): string {
    return this.connectionId;
  }
}
