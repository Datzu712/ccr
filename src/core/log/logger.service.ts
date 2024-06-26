import type { FastifyRequest } from 'fastify';
import { ConsoleLogger, ConsoleLoggerOptions, type logMessage } from './console-logger';

export type LogLevels =
    | 'log' // common messages
    | 'error' // error messages that don't break the app
    | 'warn' // warning messages
    | 'debug' // detailed messages for debugging
    | 'verbose'; // detailed messages for debugging

export interface LoggerService {
    debug: (message: logMessage, context?: string) => void;
    error: (message: logMessage, context?: string) => void;
    warn: (message: logMessage, context?: string) => void;
    log: (message: logMessage, context?: string) => void;
    verbose: (message: logMessage, context?: string) => void;
    // fatal: (message: logMessage, .context?: string) => void;
}

const defaultLogger = new ConsoleLogger();

export class Logger implements LoggerService {
    private static staticInstance?: LoggerService;
    protected localInstanceRef?: LoggerService;
    protected static logLevels: LogLevels[];

    constructor(
        private defaultContext?: string,
        instanceOptions?: ConsoleLoggerOptions,
    ) {
        // If theres not a static instance it means that the logger is not initialized, so if we don't have the "instanceOptions" to create a new instance of "ConsoleLogger", we will use the default logger.
        if (!Logger.staticInstance && !instanceOptions) {
            Logger.staticInstance = defaultLogger;

            // But if "instanceOptions" was provided, we will use it to create the new (and unique instance of ConsoleLogger).
        } else if (instanceOptions && !Logger.staticInstance) {
            Logger.staticInstance = new ConsoleLogger({
                ...instanceOptions,
                context: defaultContext,
            });
        }
        // Local instance for this instance of the logger.
        this.localInstanceRef = Logger.staticInstance;
    }

    // Public methods
    /**
     * Write an 'log' message.
     */
    public log(message: logMessage, context = this.defaultContext) {
        this.localInstanceRef?.log(message, context);
    }
    /**
     * Write an 'error' message.
     */
    public error(message: logMessage, context = this.defaultContext) {
        this.localInstanceRef?.error(message, context);
    }
    /**
     * Write an 'debug' message.
     */
    public debug(message: logMessage, context = this.defaultContext) {
        this.localInstanceRef?.debug(message, context);
    }
    /**
     * Write an 'verbose' message.
     */
    public verbose(message: logMessage, context = this.defaultContext) {
        this.localInstanceRef?.verbose(message, context);
    }
    /**
     * Write an 'warn' message.
     */
    public warn(message: logMessage, context = this.defaultContext) {
        this.localInstance?.warn(message, context);
    }

    // Static methods

    /**
     * Write an 'log' message.
     */
    static log(message: logMessage, context?: string) {
        this.staticInstance?.log(message, context);
    }
    /**
     * Write an 'error' message.
     */
    static error(message: logMessage, context?: string) {
        this.staticInstance?.error(message, context);
    }
    /**
     * Write an 'debug' message.
     */
    static debug(message: logMessage, context?: string) {
        this.staticInstance?.debug(message, context);
    }
    /**
     * Write an 'verbose' message.
     */
    static verbose(message: logMessage, context?: string) {
        this.staticInstance?.verbose(message, context);
    }
    /**
     * Write an 'warn' message.
     */
    static warn(message: logMessage, context?: string) {
        this.staticInstance?.warn(message, context);
    }

    get localInstance() {
        return this.localInstanceRef;
    }

    static overrideLocalInstance(instance: ConsoleLogger | LoggerService) {
        Logger.staticInstance = instance;
    }

    /**
     * Router logging functions.
     * @param { FastifyRequest } request - The request.
     * @param { string } payload - The response body.
     */
    public routerLogger(
        request: FastifyRequest,
        payload: string | { [x: string]: unknown },
        responseTime: number,
    ): void {
        if (!(typeof payload === 'string')) {
            payload = JSON.stringify(payload);
        }
        const responseBody = payload?.replaceAll(/"password"\s*:\s*"[a-zA-Z-]+"/g, '"password": "secret"');
        const requestBody = JSON.stringify(request.body)?.replaceAll(
            /"password"\s*:\s*"[a-zA-Z-]+"/g,
            '"password": "secret"',
        );
        const textLog =
            '<method> <statusCode> <url> from <ip> Request Body: <request-body>; Response Body: <response-body>; after <response-duration>s'
                .replaceAll('<serviceName>', 'router')
                .replaceAll('<level>', 'info')
                .replaceAll('<response-duration>', `${responseTime}`)
                .replaceAll('<statusCode>', `${request.raw.statusCode}`)
                .replaceAll('<method>', `${request.raw.method}`)
                .replaceAll('<url>', `${request.raw.url}`)
                .replaceAll('<ip>', `${request.socket.remoteAddress}`)
                .replaceAll('<userAgent>', `${request.headers['user-agent']}`)
                .replaceAll('<response-body>', responseBody)
                .replaceAll('<request-body>', requestBody);

        this.log(textLog, 'RouterLogger');
    }
}
