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
        body: 'Choose installed printers, download PDF files, create encrypted backups, manage hosted web access, and keep the desktop host ready for connected browsers.',
        keywords: ['printer', 'backup', 'pdf', 'lan', 'local files'],
      },
    ];
  }

  if (capabilities.isDemoMode) {
    return [
      {
        title: 'Demo mode limits',
        body: 'Use browser print and Save as PDF. Exact printer selection, local folders, backup, restore, and USB devices stay unavailable in the browser-only demo build.',
        keywords: ['demo', 'printer', 'backup', 'pdf', 'local files', 'usb'],
      },
    ];
  }

  return [
    {
      title: 'LAN browser access',
      body: 'This browser connects to the desktop machine through the local API. Use browser print or Save as PDF while the desktop host keeps printer, backup, and activation controls.',
      keywords: ['lan', 'desktop server', 'printer', 'backup', 'pdf'],
    },
  ];
};

const pageSections: Readonly<Record<string, readonly HelpSection[]>> = {
  login: [
    {
      title: 'Choose your account',
      body: 'Select your operator account, press Enter or choose Log in, and VaultBill will show the password field only when that account actually needs one.',
      keywords: ['operator', 'account', 'password', 'login'],
    },
  ],
  dashboard: [
    {
      title: 'Start your work',
      body: 'Records creates and finds documents, Reports summarizes business data, Builder configures formats, and Settings manages the application from one focused shell.',
      keywords: ['records', 'reports', 'builder', 'settings', 'modules'],
    },
  ],
  records: [
    {
      title: 'Create and finish a document',
      body: 'Choose a format, enter values, then Save Draft or Finalize. Draft Print does not allocate a document number, and Reprint stays available for completed records.',
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
      body: 'Choose a report, apply filters, and export or print every matching row. An empty result means no finalized records matched the current filters.',
      keywords: ['filter', 'export', 'print', 'empty results'],
    },
  ],
  builder: [
    {
      title: 'Configure document formats',
      body: 'Work through formats, fields, line items, calculations, print templates, and preview. Builder JSON stays separate from HTML print templates and the shared asset library.',
      keywords: ['fields', 'line items', 'templates', 'preview', 'assets'],
    },
  ],
  settings: [
    {
      title: 'Manage VaultBill',
      body: 'Business, security, backup, and integrations use jump links on one page. Availability follows your role and platform, with desktop-only tools staying on the host machine.',
      keywords: [
        'branding',
        'themes',
        'operators',
        'printers',
        'backup',
        'security',
        'integrations',
      ],
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
