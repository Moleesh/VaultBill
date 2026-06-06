import type { CapabilityRegistry } from '../capability/Capability.types';
import type { Role } from '../types/AppTypes';

export type HelpSection = {
  readonly title: string;
  readonly body: string;
  readonly keywords: readonly string[];
};

const platformHelp = (capabilities: CapabilityRegistry): readonly HelpSection[] => {
  if (capabilities.isDesktop) {
    return [
      {
        title: 'Desktop tools',
        body: 'Choose installed printers, download PDF files, create encrypted database backups, and manage LAN access from Settings.',
        keywords: ['printer', 'backup', 'pdf', 'lan', 'local files'],
      },
    ];
  }

  if (capabilities.isDemoMode) {
    return [
      {
        title: 'Demo mode limits',
        body: 'Use browser print and Save as PDF. Exact printer selection, local folders, backup, restore, and USB devices are unavailable in this demo build.',
        keywords: ['demo', 'printer', 'backup', 'pdf', 'local files', 'usb'],
      },
    ];
  }

  return [
    {
      title: 'LAN browser access',
      body: 'This browser connects to the desktop machine through the local API. Use browser print or Save as PDF; desktop printer and backup controls stay on the host machine.',
      keywords: ['lan', 'desktop server', 'printer', 'backup', 'pdf'],
    },
  ];
};

const pageSections: Readonly<Record<string, readonly HelpSection[]>> = {
  login: [
    {
      title: 'Choose an operator',
      body: 'Select your account, enter a PIN or password only when your administrator has enabled one, then choose Log in.',
      keywords: ['operator', 'account', 'pin', 'password', 'login'],
    },
  ],
  dashboard: [
    {
      title: 'Start your work',
      body: 'Records creates and finds documents. Reports summarizes business data. Builder configures formats. Settings manages the application.',
      keywords: ['records', 'reports', 'builder', 'settings', 'modules'],
    },
  ],
  records: [
    {
      title: 'Create and finish a document',
      body: 'Choose a format, enter values, then Save Draft or Finalize. Draft Print does not allocate a document number. Reprint is available for completed records.',
      keywords: ['format', 'save draft', 'draft print', 'finalize', 'reprint'],
    },
    {
      title: 'PDF output',
      body: 'Desktop can download a PDF directly. Browser builds use print preview and Save as PDF when direct download is unavailable.',
      keywords: ['download as pdf', 'save as pdf', 'print preview'],
    },
  ],
  reports: [
    {
      title: 'Review and export',
      body: 'Choose a report, apply filters, and export or print all matching rows. An empty result means no finalized records matched the current filters.',
      keywords: ['filter', 'export', 'print', 'empty results'],
    },
  ],
  builder: [
    {
      title: 'Configure document formats',
      body: 'Work through formats, fields, line items, calculations, print templates, placeholders, and sample values. Changes are validated before saving.',
      keywords: ['fields', 'line items', 'placeholders', 'templates', 'sample values'],
    },
  ],
  settings: [
    {
      title: 'Manage VaultBill',
      body: 'Branding, themes, operators, printers, backup, security, network, and help are separated into focused tabs. Availability follows your role and platform.',
      keywords: ['branding', 'themes', 'operators', 'printers', 'backup', 'security'],
    },
  ],
};

export const getHelpSections = (
  page: string,
  role: Role,
  capabilities: CapabilityRegistry,
): readonly HelpSection[] => {
  const roleSection: HelpSection = {
    title: 'Your access',
    body:
      role === 'SysAdmin'
        ? 'You can use Builder and system configuration tools.'
        : `You are signed in as ${role}. Features outside your access level remain unavailable.`,
    keywords: ['permission', 'role', role],
  };

  return [
    ...(pageSections[page] ?? pageSections.dashboard ?? []),
    roleSection,
    ...platformHelp(capabilities),
  ];
};
