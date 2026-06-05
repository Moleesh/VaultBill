import { defaultTagline } from './AppIdentity';
import type { RuntimeBranding, ShellSection, ThemeOption } from '../types/AppTypes';

export const defaultRuntimeBranding: RuntimeBranding = {
  applicationName: 'VaultBill',
  companyName: '',
  tagline: defaultTagline,
  applicationLogoAssetId: '',
  printLogoAssetId: '',
  faviconAssetId: '',
};

export const themeOptions: readonly ThemeOption[] = [
  { id: 'teal-flow', label: 'Teal Flow' },
  { id: 'slate-pro', label: 'Slate Pro' },
  { id: 'midnight-ink', label: 'Midnight Ink' },
  { id: 'sandstone-ledger', label: 'Sandstone Ledger' },
  { id: 'indigo-mint', label: 'Indigo Mint' },
];

export const shellSections: readonly ShellSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Quick actions and recent business activity.',
    isEnabled: true,
  },
  {
    id: 'records',
    label: 'Records',
    description: 'Draft, finalize, print, and reprint documents.',
    isEnabled: true,
    requiredCapabilities: ['DataEntry'],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Find, export, and print business reports.',
    isEnabled: true,
    requiredCapabilities: ['ViewReports'],
  },
  {
    id: 'builder',
    label: 'Builder',
    description: 'Configure document formats and print templates.',
    isEnabled: true,
    requiredCapabilities: ['DocumentFormatEditing'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Branding, themes, operators, and backup.',
    isEnabled: true,
    requiredCapabilities: ['BrandingSettings', 'UserAccountManagement', 'BackupRestore'],
  },
];
