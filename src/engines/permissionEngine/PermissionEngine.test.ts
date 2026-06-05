import { describe, expect, it } from 'vitest';

import {
  applyNavigationPermissions,
  evaluateAnyCapability,
  hasCapability,
} from './PermissionEngine';

describe('PermissionEngine', () => {
  it('keeps the hard-coded role matrix authoritative', () => {
    expect(hasCapability('SysAdmin', 'BrandingSettings')).toBe(true);
    expect(hasCapability('SysAdmin', 'UserAccountManagement')).toBe(false);
    expect(hasCapability('Admin', 'UserAccountManagement')).toBe(true);
    expect(hasCapability('Admin', 'PermanentDeleteRecord')).toBe(false);
    expect(hasCapability('User', 'DataEntry')).toBe(true);
    expect(hasCapability('User', 'DocumentFormatEditing')).toBe(false);
  });

  it('allows an action when any required capability is available', () => {
    expect(evaluateAnyCapability('Admin', ['BrandingSettings', 'UserAccountManagement'])).toEqual({
      isAllowed: true,
      reason: 'Admin can use UserAccountManagement.',
    });
  });

  it('prevents navigation config from granting denied capabilities', () => {
    const items = [
      {
        id: 'builder',
        isEnabled: true,
        requiredCapabilities: ['DocumentFormatEditing'] as const,
      },
    ];

    const [builderItem] = applyNavigationPermissions('User', items);

    expect(builderItem?.isEnabled).toBe(false);
    expect(builderItem?.permissionDecision.isAllowed).toBe(false);
  });
});
