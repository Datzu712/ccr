import fastify from 'fastify';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import type { ServerOptions as httpsServerOptions } from 'https';

import { requestLogger } from '../helper/requestLogger';
import { Logger, type LoggerService } from '../core/log/logger.service';
import { enableHttps } from '../config/config.env.constants';

export interface ServerOptions {
    /**
     * Port to listen on.
     * @default 8080
     */
    port?: number;
    /**
     * Host to listen on.
     * @default localhost
     */
    host?: string;
    /**
     * HTTPS configuration.
     * @default undefined
     */
    https?: httpsServerOptions;
    /**
     * Enable or disable logs or set it.
     * @default false
     */
    logger?: LoggerService;
    /**
     * Sentry configuration.
     * @default undefined
     */
    sentry?: {
        dsn: string;
        environment?: string;
    };
    /**
     * NestJS module to use.
     */
    module: unknown;
}

export class Server {
    public app!: NestFastifyApplication;
    public readonly logger: LoggerService;
    public readonly PORT: number;
    public readonly HOST: string;
    public readonly httpsConfig: httpsServerOptions;
    public readonly sentryDSN: string | undefined;
    public readonly module: unknown;

    constructor(options: ServerOptions) {
        if (!options.module) {
            throw new Error('No module provided');
        }
        this.module = options.module;
        this.PORT = options.port ?? 8080;
        this.HOST = options.host ?? 'localhost';
        this.httpsConfig = options.https ?? {};
        this.sentryDSN = options.sentry?.dsn;

        this.logger = options.logger || Logger;
    }

    /**
     * Connect to database, initialize sentry, and initialize nestjs with fastify.
     */
    public async start(): Promise<void> {
        // Initialize Fastify
        const fastifyInstance = fastify({
            logger: false,
            ...(Object.keys(this.httpsConfig).length && Boolean(enableHttps) ? { https: this.httpsConfig } : {}),
        });

        fastifyInstance.addHook('onSend', (request, reply, payload: string | { [x: string]: unknown }, next) => {
            next();
            request.raw.statusCode = reply.statusCode;

            requestLogger(request, payload as string, reply.getResponseTime());
        });
        this.app = await NestFactory.create<NestFastifyApplication>(
            this.module,
            new FastifyAdapter(fastifyInstance as never),
            {
                logger: this.logger,
            },
        );
        if (Object.keys(this.httpsConfig).length && Boolean(enableHttps)) {
            this.app.enableCors();
        }

        await this.app.listen(this.PORT, this.HOST);
        this.logger.log(
            `Application is listening on: ${
                Object.keys(this.httpsConfig).length && Boolean(enableHttps)
                    ? (await this.app.getUrl()).replace('http', 'https')
                    : await this.app.getUrl()
            }`,
        );
    }
}
