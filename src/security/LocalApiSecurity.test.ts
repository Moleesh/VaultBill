import { describe, expect, it } from 'vitest';

import {
  canUseLocalApiAction,
  getLocalApiHost,
  isAllowedLocalApiOrigin,
  LocalApiConfigurationSchema,
  MAX_LOCAL_API_BODY_BYTES,
} from '../../electron/server/LocalApiSecurity';

describe('Local API security', () => {
  it('binds locally unless LAN is explicitly enabled', () => {
    const local = LocalApiConfigurationSchema.parse({});
    const lan = LocalApiConfigurationSchema.parse({ lanEnabled: true });
    expect(getLocalApiHost(local)).toBe('127.0.0.1');
    expect(getLocalApiHost(lan)).toBe('0.0.0.0');
  });

  it('accepts only known development or same-host origins', () => {
    expect(isAllowedLocalApiOrigin('http://127.0.0.1:4317', '127.0.0.1:4317')).toBe(true);
    expect(isAllowedLocalApiOrigin('https://evil.example', '127.0.0.1:4317')).toBe(false);
  });

  it('enforces privileged actions and a bounded request size', () => {
    expect(canUseLocalApiAction('User', 'cancel')).toBe(false);
    expect(canUseLocalApiAction('Admin', 'cancel')).toBe(true);
    expect(MAX_LOCAL_API_BODY_BYTES).toBe(100 * 1024 * 1024);
  });
});
