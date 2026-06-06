import { z } from 'zod';

export const MAX_LOCAL_API_BODY_BYTES = 2 * 1024 * 1024;

export const LocalApiConfigurationSchema = z.object({
  lanEnabled: z.boolean().default(false),
  passwordRequired: z.boolean().default(true),
  port: z.number().int().min(1024).max(65_535).default(4317),
});

export type LocalApiConfiguration = z.infer<typeof LocalApiConfigurationSchema>;

export const getLocalApiHost = (configuration: LocalApiConfiguration): string =>
  configuration.lanEnabled ? '0.0.0.0' : '127.0.0.1';

export const isAllowedLocalApiOrigin = (
  origin: string | undefined,
  requestHost?: string,
  configuredLanOrigin?: string,
): boolean => {
  if (!origin) return true;
  if (requestHost && origin === `http://${requestHost}`) return true;
  const allowedOrigins = new Set([
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4317',
    'http://localhost:4317',
    ...(configuredLanOrigin ? [configuredLanOrigin] : []),
  ]);
  return allowedOrigins.has(origin);
};

export const canUseLocalApiAction = (
  role: 'SysAdmin' | 'Admin' | 'User',
  action: 'list' | 'saveDraft' | 'finalize' | 'cancel' | 'configureLan',
): boolean => {
  if (action === 'configureLan' || action === 'cancel') return role !== 'User';
  return true;
};
