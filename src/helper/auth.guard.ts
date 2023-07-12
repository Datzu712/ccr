import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { ConfigService } from '@nestjs/config';
import { Logger } from '../core/log';

@Injectable()
export class AuthGuard implements CanActivate {
    private logger = new Logger('AuthGuard');

    constructor(private readonly configService: ConfigService<IEnvironmentVariables>) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();

        console.log(request.headers);
        const token = request.headers.authorization;
        if (token !== this.configService.get<string>('API_ACCESS_TOKEN')) {
            throw new UnauthorizedException();
        }

        return true;
    }
}
