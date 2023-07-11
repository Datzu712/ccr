import * as colors from './colors';
import { createWriteStream, existsSync, mkdirSync, WriteStream } from 'fs';

import type { DeepRequired } from 'ts-essentials';
import { inspect } from 'util';
import type { LoggerService, LogLevels } from './logger.service';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type logMessage = any;

export type MessageLogExpressionsKey = 'context' | 'message' | 'level' | 'timestamp' | 'pid';

export interface ConsoleLoggerOptions {
    /**
     * The directory to log to.
     */
    folderPath?: string;
    /**
     * Excepted output template. It will be used to format the output (log message).
     * @default '{timestamp} {context} {level} {message}'
     */
    outputTemplate?: string;
    /**
     * Testing mode.
     * Enable it and the logger will write the logs in a different folder.
     * @default false
     */
    testing?: boolean;
    /**
     * Enabled log levels. If some log level is not enabled, the logger will not log it.
     * @default ['log'];
     */
    logLevels?: LogLevels[];
    /**
     * Allows the logger to write (or create) in the files of the folder given in 'folderPath'.
     */
    allowWriteFiles?: boolean;
    /**
     * Allows the output in the console.
     */
    allowConsole?: boolean | LogLevels[];
    /**
     * Default context.
     */
    context?: string;
    /**
     * Spaces to indent the output.
     */
    indents?: {
        [key in MessageLogExpressionsKey]?: number;
    };
}

const defaultLogLevels: LogLevels[] = ['log', 'error', 'warn', 'debug', 'verbose'];

/**
 * 
 * [Timestamp] [Level] [Component/Module] [Message] [Optional data/metadata]

Ejemplo:

[2022-12-01 12:34:56] [ERROR] [Auth Module] [Unauthorized access attempt] [IP Address: 123.456.789.0 User-Agent: Mozilla/5.0]
[2022-12-01 12:35:10] [INFO] [Payments Module] [Payment processed successfully] [Transaction ID: abcdefghijklmnopqrstuvwxyz Amount: $100]

 */
export class ConsoleLogger implements LoggerService {
    protected options: Omit<DeepRequired<ConsoleLoggerOptions>, 'folderPath'> & {
        folderPath?: string;
    };

    debug!: (message: any, ...optionalArguments: any[]) => void;
    error!: (message: any, ...optionalArguments: any[]) => void;
    warn!: (message: any, ...optionalArguments: any[]) => void;
    verbose!: (message: any, ...optionalArguments: any[]) => void;
    log!: (message: any, ...optionalArguments: any[]) => void;

    constructor(options?: ConsoleLoggerOptions) {
        this.options = {
            outputTemplate: options?.outputTemplate || '{timestamp} {pid} {level} {message}',
            testing: options?.testing ?? false,
            logLevels: options?.logLevels || ['error', 'warn', 'log', 'debug'],
            allowWriteFiles: options?.allowWriteFiles ?? true,
            allowConsole: options?.allowConsole ?? true,
            context: options?.context || 'null',
            folderPath: options?.folderPath,
            indents: {
                timestamp: options?.indents?.timestamp ?? 0,
                pid: options?.indents?.pid ?? 0,
                level: options?.indents?.level ?? 0,
                message: options?.indents?.message ?? 0,
                context: options?.indents?.context ?? 0,
            },
        };
        for (const logLevel of defaultLogLevels) {
            this[logLevel] = this.defaultLogWriter.bind(this, logLevel);
        }
    }

    private defaultLogWriter(level: LogLevels, message: logMessage, context = this.options.context): void {
        if (!this.isLevelEnabled(level)) return;

        if (
            (Array.isArray(this.options.allowConsole) && this.options.allowConsole.includes(level)) ||
            this.options.allowConsole === true
        ) {
            const stdType = level === 'error' ? 'stderr' : 'stdout';
            process[stdType].write(
                `${this.createMessage({
                    level,
                    message,
                    context,
                    colorize: true,
                })}\n`,
            );
        }
        if (this.options.allowWriteFiles && this.options.folderPath) {
            this.write(this.createMessage({ level, message, context, colorize: false }), level);
        }
    }

    public createMessage({
        level,
        message,
        context = this.options.context || 'null',
        colorize,
    }: {
        level: LogLevels;
        message: logMessage;
        context?: string;
        colorize: boolean;
    }): string {
        const pid = this.getPid();
        const timestamp = this.getTimestamp(true);

        return this.options.outputTemplate
            .replaceAll(
                '{timestamp}',
                `${colorize ? `${colors.green}${timestamp}${colors.reset}` : timestamp}${this.formatIndentationText(
                    this.options.indents.timestamp,
                    timestamp,
                )}`,
            )
            .replaceAll(
                '{pid}',
                `${colorize ? `${colors.green}${pid}${colors.reset}` : pid}${this.formatIndentationText(
                    this.options.indents.pid,
                    pid,
                )}`,
            )
            .replaceAll(
                '{level}',
                `${colorize ? this.formatLevel(level) : level.toUpperCase()}${this.formatIndentationText(
                    this.options.indents.level,
                    level,
                )}`,
            )
            .replaceAll(
                '{message}',
                `${
                    typeof message === 'string' ? message : inspect(message, { colors: colorize, depth: null })
                }${this.formatIndentationText(this.options.indents.message, message)}`,
            )
            .replaceAll(
                '{context}',
                `${colorize ? `${colors.red}${context}${colors.reset}` : context}${this.formatIndentationText(
                    this.options.indents.context,
                    context,
                )}`,
            );
    }
    /**
     * Format the indentation of text
     * @param { number } indent - The number of the max length of the text. If the provided text is not longer than "indent", the text will be padded with spaces to reach the "indent" length.
     * @param { string } text - The text to format.
     * @returns { string } Spaces to indent the text.
     */
    private formatIndentationText = (indent: number, text: string): string => {
        const textLength = text?.length || 0;
        const indentationLength = Math.max(0, indent - textLength);
        return ' '.repeat(indentationLength);
    };

    /**
     * Write the log.
     * @param { string } message - The message to log.
     * @param { LogLevel } level - The level of the log.
     */
    private write(message: string, level: LogLevels): void {
        const file = this.createWritableLogStream(level);
        file.write(`${message}\n`);
        file.close();
    }
    /**
     * Get the file log by level.
     * @param { LogLevel } level - The level of the log.
     * @returns { WriteStream } WriteStream - The file log.
     */
    private createWritableLogStream(level: LogLevels): WriteStream {
        if (!existsSync(this.options.folderPath as string)) mkdirSync(this.options.folderPath as string);
        if (this.options.testing) {
            // Path to testing logs folder
            const path = `${this.options.folderPath}/testing`;
            if (!existsSync(path)) mkdirSync(path);
        }
        let fileType: 'log' | 'debug' | 'error' = 'log';
        /*
            We divide each logs in different files (Error, debug and log).
            Error > only errors
            debug > only debug
            log > Rest of the logs (warn, info, log, etc)
        */
        if (level === 'debug' || level === 'error') {
            fileType = level === 'debug' ? 'debug' : 'error';
        }
        return createWriteStream(
            `${this.options.folderPath}${this.options.testing ? '/testing/' : '/'}${this.getTimestamp().replaceAll(
                '/',
                '-',
            )}${
                this.options.testing
                    ? `${fileType == 'error' ? '.error' : ''}.test`
                    : fileType === 'log'
                    ? ''
                    : `-${fileType}`
            }.log`,
            {
                flags: 'a',
            },
        );
    }

    /**
     * Checks if the given log level is enabled (options.logLevels).
     * @param { LogLevels } level - The log level to check.
     * @returns { Boolean } True if the log level is enabled, false otherwise.
     */
    public isLevelEnabled(level: LogLevels): boolean {
        return this.options.logLevels.includes(level);
    }

    public getPid(): string {
        return `[${this.options.context ?? 'Application'} - ${process.pid}]`;
    }

    public formatLevel(level: LogLevels): string {
        const color =
            level === 'error'
                ? colors.red
                : level === 'warn'
                ? colors.yellow
                : level === 'debug'
                ? colors.magenta
                : level === 'verbose'
                ? colors.magenta
                : colors.cyan;
        return `${color}${level.toUpperCase()}${colors.reset}`;
    }

    public getTimestamp(fullDate = false): string {
        const localeStringOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            hour: fullDate ? 'numeric' : undefined,
            minute: fullDate ? 'numeric' : undefined,
            second: fullDate ? 'numeric' : undefined,
            day: '2-digit',
            month: '2-digit',
        };
        return new Date(Date.now()).toLocaleString(undefined, localeStringOptions);
    }
}
