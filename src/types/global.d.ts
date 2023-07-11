declare interface IEnvironmentVariables {
    CCR_USERNAME: string;
    CCR_PASSWORD: string;
    CCR_USER_ID: string;
    CCR_SERVICE_ID: string;
    CCR_CLIENT_CODE: string;
    CCR_SOAP_URL: string;
    CCR_SYSTEM: string;
    API_ACCESS_TOKEN: string;
    SSL_PRIVATE_KEY_PATH: string;
    SSL_PUBLIC_CERT_PATH: string;
    SERVER_PORT: string;
}

declare namespace NodeJS {
    export interface ProcessEnv extends IEnvironmentVariables {
        TZ?: string | undefined;
    }
}
