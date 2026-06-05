import { describe, expect, it } from 'vitest';

import { shouldRedirectToBasePath } from './githubPagesRedirect';

describe('shouldRedirectToBasePath', () => {
  it('accepts the canonical VaultBill path with or without a trailing slash', () => {
    expect(shouldRedirectToBasePath('/VaultBill/', '/VaultBill/')).toBe(false);
    expect(shouldRedirectToBasePath('/VaultBill', '/VaultBill/')).toBe(false);
  });

  it('redirects every other pathname back to the canonical base path', () => {
    expect(shouldRedirectToBasePath('/', '/VaultBill/')).toBe(true);
    expect(shouldRedirectToBasePath('/VaultBill/reports', '/VaultBill/')).toBe(true);
    expect(shouldRedirectToBasePath('/other-app/', '/VaultBill/')).toBe(true);
  });
});
