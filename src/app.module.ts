import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { CCRController } from './ccr.controller';
import { CCRClient } from './core/ccr-client/ccr-client.service';
import { AuthGuard } from './helper/auth.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env', '.development.env'],
            validate: validateEnv,
            isGlobal: true,
        }),
    ],
    controllers: [CCRController],
    providers: [
        {
            provide: CCRClient,
            useFactory: async (configService: ConfigService) => {
                const credentials = {
                    username: configService.get<string>('CCR_USERNAME') as string,
                    password: configService.get<string>('CCR_PASSWORD') as string,
                    user_id: configService.get<string>('CCR_USER_ID') as string,
                    service_id: configService.get<string>('CCR_SERVICE_ID') as string,
                    client_code: configService.get<string>('CCR_CLIENT_CODE') as string,
                    soap_url: configService.get<string>('CCR_SOAP_URL') as string,
                    system: configService.get<string>('CCR_SYSTEM') as string,
                };

                const ccrClient = new CCRClient(credentials);
                await ccrClient.start();

                return ccrClient;
            },
            inject: [ConfigService],
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class AppModule {}
