import { readFileSync } from 'fs';
import { config } from 'dotenv';
config();

export const privateKey = readFileSync(process.env.SSL_PRIVATE_KEY_PATH).toString();
export const publicCert = readFileSync(process.env.SSL_PUBLIC_CERT_PATH).toString();
export const enableHttps = process.env.ENABLE_HTTPS == 'true';
export const serverPort = parseInt(process.env.SERVER_PORT);
