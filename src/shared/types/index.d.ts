export interface User {
    id: string;
    username: string;
    email: string;
    password?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserSession {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export interface ServerConnection {
    id: string;
    userId: string;
    name: string;
    host: string;
    port: number;
    protocol: ProtocolType;
    username: string;
    password?: string;
    privateKey?: string;
    description?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export type ProtocolType = 'ssh' | 'telnet' | 'rdp' | 'vnc' | 'sftp';
export interface Session {
    id: string;
    userId: string;
    connectionId: string;
    status: SessionStatus;
    startTime: Date;
    endTime?: Date;
    lastActivity: Date;
    data?: any;
}
export type SessionStatus = 'active' | 'inactive' | 'terminated';
export interface CommandLog {
    id: string;
    sessionId: string;
    userId: string;
    command: string;
    output?: string;
    timestamp: Date;
    duration?: number;
}
export interface FavoriteCommand {
    id: string;
    userId: string;
    name: string;
    command: string;
    description?: string;
    tags?: string[];
    createdAt: Date;
}
export interface WSMessage {
    type: WSMessageType;
    sessionId?: string;
    data?: any;
    timestamp: Date;
}
export type WSMessageType = 'terminal_data' | 'terminal_resize' | 'session_start' | 'session_end' | 'session_status' | 'command_log' | 'error' | 'ping' | 'pong';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface TerminalSize {
    cols: number;
    rows: number;
}
export interface TerminalData {
    data: string;
    sessionId: string;
}
//# sourceMappingURL=index.d.ts.map