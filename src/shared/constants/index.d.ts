export declare const APP_CONFIG: {
    readonly NAME: "ShellGate";
    readonly VERSION: "1.0.0";
    readonly DESCRIPTION: "Web-based remote control tool";
};
export declare const SERVER_CONFIG: {
    readonly PORT: string | 3000;
    readonly HOST: string;
    readonly NODE_ENV: string;
};
export declare const DATABASE_CONFIG: {
    readonly PATH: string;
    readonly BACKUP_PATH: string;
};
export declare const JWT_CONFIG: {
    readonly SECRET: string;
    readonly EXPIRES_IN: string;
    readonly REFRESH_EXPIRES_IN: string;
};
export declare const WS_CONFIG: {
    readonly PING_INTERVAL: 30000;
    readonly PONG_TIMEOUT: 5000;
    readonly MAX_CONNECTIONS_PER_USER: 10;
};
export declare const PROTOCOL_PORTS: {
    readonly ssh: 22;
    readonly telnet: 23;
    readonly rdp: 3389;
    readonly vnc: 5900;
    readonly sftp: 22;
};
export declare const SESSION_CONFIG: {
    readonly TIMEOUT: number;
    readonly MAX_SESSIONS_PER_USER: 20;
    readonly CLEANUP_INTERVAL: number;
};
export declare const LOG_CONFIG: {
    readonly MAX_COMMAND_LENGTH: 10000;
    readonly MAX_OUTPUT_LENGTH: 100000;
    readonly RETENTION_DAYS: 90;
    readonly CLEANUP_INTERVAL: number;
};
export declare const UPLOAD_CONFIG: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_TYPES: readonly [".key", ".pem", ".pub", ".txt"];
    readonly UPLOAD_PATH: "./data/uploads";
};
export declare const SECURITY_CONFIG: {
    readonly BCRYPT_ROUNDS: 12;
    readonly MAX_LOGIN_ATTEMPTS: 5;
    readonly LOCKOUT_DURATION: number;
    readonly PASSWORD_MIN_LENGTH: 8;
};
export declare const API_CONFIG: {
    readonly PREFIX: "/api/v1";
    readonly RATE_LIMIT: {
        readonly WINDOW_MS: number;
        readonly MAX_REQUESTS: 100;
    };
    readonly PAGINATION: {
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
    };
};
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly CONNECTION_NOT_FOUND: "CONNECTION_NOT_FOUND";
    readonly CONNECTION_FAILED: "CONNECTION_FAILED";
    readonly PROTOCOL_NOT_SUPPORTED: "PROTOCOL_NOT_SUPPORTED";
    readonly SESSION_NOT_FOUND: "SESSION_NOT_FOUND";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly MAX_SESSIONS_EXCEEDED: "MAX_SESSIONS_EXCEEDED";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly FORBIDDEN: "FORBIDDEN";
};
//# sourceMappingURL=index.d.ts.map