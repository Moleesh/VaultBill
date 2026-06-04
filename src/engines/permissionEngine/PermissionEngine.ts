import type { Role } from '../../types/AppTypes';
import type {
  Capability,
  NavigationPermissionItem,
  NavigationPermissionResult,
  PermissionDecision,
  RoleCapabilityMap,
} from './PermissionTypes';

const sharedCapabilities: readonly Capability[] = [
  'DataEntry',
  'SaveDraft',
  'DraftPrint',
  'FinalPrintReprint',
  'ViewReports',
  'SwitchDocumentFormat',
  'SwitchTheme',
];

export const roleCapabilityMap: RoleCapabilityMap = {
  SysAdmin: new Set([
    ...sharedCapabilities,
    'BrandingSettings',
    'ThemeLock',
    'DocumentFormatEditing',
    'PrintTemplateUpload',
    'FieldReportPlaceholderConfiguration',
    'PermanentDeleteRecord',
  ]),
  Admin: new Set([
    ...sharedCapabilities,
    'UserAccountManagement',
    'SequenceManagement',
    'BackupRestore',
    'CancelFinalizedRecord',
  ]),
  User: new Set(sharedCapabilities),
};

export const hasCapability = (role: Role, capability: Capability): boolean =>
  roleCapabilityMap[role].has(capability);

export const evaluateCapability = (
  role: Role,
  capability: Capability,
): PermissionDecision => {
  if (hasCapability(role, capability)) {
    return {
      isAllowed: true,
      reason: `${role} can use ${capability}.`,
    };
  }

  return {
    isAllowed: false,
    reason: `${role} cannot use ${capability}; the hard-coded access matrix denies it.`,
  };
};

export const evaluateAnyCapability = (
  role: Role,
  capabilities: readonly Capability[] = [],
): PermissionDecision => {
  if (capabilities.length === 0) {
    return { isAllowed: true, reason: 'No capability is required.' };
  }

  const allowedCapability = capabilities.find((capability) =>
    hasCapability(role, capability),
  );

  if (allowedCapability) {
    return evaluateCapability(role, allowedCapability);
  }

  return {
    isAllowed: false,
    reason: `${role} cannot use any required capability for this action.`,
  };
};

export const applyNavigationPermissions = <TItem extends NavigationPermissionItem>(
  role: Role,
  items: readonly TItem[],
): readonly NavigationPermissionResult<TItem>[] =>
  items.map((item) => {
    const permissionDecision = evaluateAnyCapability(role, item.requiredCapabilities);

    return {
      ...item,
      isEnabled: item.isEnabled && permissionDecision.isAllowed,
      permissionDecision,
    };
  });
