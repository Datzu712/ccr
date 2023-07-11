import { privateKey, publicCert, serverPort } from './config/config.env.constants';
import { AppModule } from './app.module';
import { Server } from './core/Server';
import { Logger } from './core/log';
import { getIP } from './helper/net';

const logger = new Logger('CCR-API', {
    logLevels: ['debug', 'error', 'warn', 'verbose', 'log'],
    folderPath: './logs',
    allowConsole: ['error', 'warn', 'log', 'debug'],
    allowWriteFiles: true,
    outputTemplate: '{pid} {timestamp} - {level} {context} {message}',
    indents: {
        level: 7,
        context: 20,
    },
});

(async () => {
    const server = new Server({
        port: serverPort,
        host: getIP(),
        module: AppModule,
        logger: logger,
        https: {
            key: privateKey,
            cert: publicCert,
        },
    });
    await server.start();

    process.on('unhandledRejection', (error) => server.logger.error(error, 'main'));
})();
