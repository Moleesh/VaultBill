/** @format */

import { z } from 'zod';

/** Maximum accepted JSON body size for hosted local API requests. */
export const MAX_LOCAL_API_BODY_BYTES = 100 * 1024 * 1024;
/** Preferred hosted-web port used by the desktop runtime. */
export const defaultHostedWebPort = 80;
/** Backup hosted-web port used when the preferred port is unavailable. */
export const fallbackHostedWebPort = 8000;

/** Hosted local API configuration persisted through the settings store. */
export const LocalApiConfigurationSchema = z.object({
    lanEnabled: z.boolean().default(false),
    passwordRequired: z.boolean().default(true),
    port: z.number().int().min(1).max(65_535).default(defaultHostedWebPort),
    autoStart: z.boolean().default(true),
});

/** Parsed hosted API configuration shape used by the Electron runtime. */
export type LocalApiConfiguration = z.infer<typeof LocalApiConfigurationSchema>;

/** Returns the listening host based on whether LAN access is enabled. */
export const getLocalApiHost = (configuration: LocalApiConfiguration): string =>
    configuration.lanEnabled ? '0.0.0.0' : '127.0.0.1';

/** Validates whether a browser origin is allowed to call the hosted local API. */
export const isAllowedLocalApiOrigin = (
    origin: string | undefined,
    requestHost?: string,
    configuredLanOrigin?: string,
): boolean => {
    if (!origin) return true;
    if (requestHost && origin === `http://${requestHost}`) return true;
    const allowedOrigins = new Set([
        'http://127.0.0.1',
        'http://localhost',
        'http://127.0.0.1:80',
        'http://localhost:80',
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        ...(configuredLanOrigin ? [configuredLanOrigin] : []),
    ]);
    return allowedOrigins.has(origin);
};

/** Reports whether a role may perform the named hosted local API action. */
export const canUseLocalApiAction = (
    role: 'SysAdmin' | 'Admin' | 'User',
    action: 'list' | 'saveDraft' | 'finalize' | 'cancel' | 'configureLan',
): boolean => {
    if (action === 'configureLan' || action === 'cancel') return role !== 'User';
    return role === 'Admin' || role === 'User';
};
