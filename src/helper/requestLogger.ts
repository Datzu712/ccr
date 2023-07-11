import type { FastifyRequest } from 'fastify';
import { Logger } from '../core/log/logger.service';

export function requestLogger(
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

    Logger.log(textLog, 'RouterLogger');
}
