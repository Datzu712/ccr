import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';

class EnvironmentVariables implements IEnvironmentVariables {
    @IsString()
    SSL_PRIVATE_KEY_PATH!: string;
    @IsString()
    SSL_PUBLIC_CERT_PATH!: string;
    @IsString()
    CCR_USERNAME!: string;
    @IsString()
    CCR_PASSWORD!: string;
    @IsString()
    CCR_USER_ID!: string;
    @IsString()
    CCR_SERVICE_ID!: string;
    @IsString()
    CCR_CLIENT_CODE!: string;
    @IsString()
    CCR_SOAP_URL!: string;
    @IsString()
    CCR_SYSTEM!: string;
    @IsString()
    API_ACCESS_TOKEN!: string;
    @IsString()
    SERVER_PORT!: string;
}

export function validateEnv(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
