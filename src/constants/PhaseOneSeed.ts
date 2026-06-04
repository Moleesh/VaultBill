import { defaultTagline } from './AppIdentity';
import type {
  PhaseCard,
  RuntimeBranding,
  ShellSection,
  ThemeOption,
} from '../types/AppTypes';

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
  { id: 'midnight-ink', label: 'Midnight Ink' },
  { id: 'rust-stone', label: 'Rust & Stone' },
  { id: 'slate-pro', label: 'Slate Pro' },
  { id: 'blush-ledger', label: 'Blush Ledger' },
];

export const shellSections: readonly ShellSection[] = [
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
    description: 'JSON-configured reports and exports.',
    isEnabled: true,
    requiredCapabilities: ['ViewReports'],
  },
  {
    id: 'builder',
    label: 'Builder',
    description: 'SysAdmin format and template configuration.',
    isEnabled: true,
    requiredCapabilities: ['DocumentFormatEditing'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Branding, themes, operators, and backup.',
    isEnabled: true,
    requiredCapabilities: [
      'BrandingSettings',
      'UserAccountManagement',
      'BackupRestore',
    ],
  },
];

export const phaseOneCards: readonly PhaseCard[] = [
  {
    title: 'Ports-and-adapters seams',
    summary: 'Electron, browser, local API, and future DB work have clear homes.',
    state: 'ready',
  },
  {
    title: 'Responsive product shell',
    summary: 'Single-page tabs, guarded panels, and adaptive action surfaces.',
    state: 'ready',
  },
  {
    title: 'Theme foundations',
    summary: 'Five built-in themes use shared tokens and are ready for locking.',
    state: 'ready',
  },
  {
    title: 'Next: format fallback',
    summary: 'Phase 4 resolves formats by ID, name, then default.',
    state: 'next',
  },
];
