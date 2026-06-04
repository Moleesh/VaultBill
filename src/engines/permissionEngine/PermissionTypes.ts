import type { Role } from '../../types/AppTypes';

export type Capability =
  | 'BrandingSettings'
  | 'ThemeLock'
  | 'DocumentFormatEditing'
  | 'PrintTemplateUpload'
  | 'FieldReportPlaceholderConfiguration'
  | 'UserAccountManagement'
  | 'SequenceManagement'
  | 'BackupRestore'
  | 'CancelFinalizedRecord'
  | 'PermanentDeleteRecord'
  | 'DataEntry'
  | 'SaveDraft'
  | 'DraftPrint'
  | 'FinalPrintReprint'
  | 'ViewReports'
  | 'SwitchDocumentFormat'
  | 'SwitchTheme';

export type PermissionDecision = {
  readonly isAllowed: boolean;
  readonly reason: string;
};

export type NavigationPermissionItem = {
  readonly id: string;
  readonly isEnabled: boolean;
  readonly requiredCapabilities?: readonly Capability[];
};

export type NavigationPermissionResult<TItem extends NavigationPermissionItem> =
  TItem & {
    readonly isEnabled: boolean;
    readonly permissionDecision: PermissionDecision;
  };

export type RoleCapabilityMap = Readonly<Record<Role, ReadonlySet<Capability>>>;
