import { networkInterfaces } from 'os';

export function getIP(): string | undefined {
    const netInterfaces = networkInterfaces();

    const [{ address }] = Object.values(netInterfaces).flatMap(
        (netInterface) =>
            netInterface?.filter((prop) => prop.family === 'IPv4' && !prop.internal) as { address: string }[],
    );
    return address;
}
