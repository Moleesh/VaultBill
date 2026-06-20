/** @format */

import net from 'node:net';

export const preferredDevWebPort = 80;
export const fallbackDevWebPort = 5173;

const devServerHost = '0.0.0.0';

const isPortAvailable = (port) =>
    new Promise((resolve) => {
        const server = net.createServer();
        server.unref();
        server.on('error', () => {
            resolve(false);
        });
        server.listen({ host: devServerHost, port, exclusive: true }, () => {
            server.close(() => {
                resolve(true);
            });
        });
    });

/** Returns the preferred dev web port, falling back when port 80 is busy. */
export const resolveDevWebPort = async () => {
    const requestedPort = Number.parseInt(process.env.VITE_WEB_PORT ?? '', 10);
    if (Number.isInteger(requestedPort) && requestedPort > 0) return requestedPort;
    return (await isPortAvailable(preferredDevWebPort))
        ? preferredDevWebPort
        : fallbackDevWebPort;
};
