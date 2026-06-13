/** @format */

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
                body: 'Use printers, backups, hosted web access, and activation on the desktop host.',
                keywords: ['printer', 'backup', 'pdf', 'lan', 'hosted web'],
            },
        ];
    }

    if (capabilities.isDemoMode) {
        return [
            {
                title: 'Demo mode limits',
                body: 'Use browser print and Save as PDF. Printer selection, backup, restore, and USB devices stay on the desktop build.',
                keywords: ['demo', 'printer', 'backup', 'pdf', 'usb'],
            },
        ];
    }

    return [
        {
            title: 'LAN browser access',
            body: 'This browser connects to the desktop host through the local API. Use browser print or Save as PDF while the host keeps printer, backup, and activation controls.',
            keywords: ['lan', 'desktop server', 'printer', 'backup', 'pdf'],
        },
    ];
};

const pageSections: Readonly<Record<string, readonly HelpSection[]>> = {
    login: [
        {
            title: 'Choose your account',
            body: 'Choose your account, enter the password only when one is set, and press Enter to log in.',
            keywords: ['operator', 'account', 'password', 'login'],
        },
    ],
    dashboard: [
        {
            title: 'Start your work',
            body: 'Records handles documents, Reports shows totals, Document builder configures formats, and SysAdmin reviews inventory, backup health, and trial time.',
            keywords: ['records', 'reports', 'builder', 'settings', 'dashboard'],
        },
    ],
    records: [
        {
            title: 'Create and finish a document',
            body: 'Choose a format, fill in the fields, then save a draft or finalize. Draft Print keeps the document number free until you are ready.',
            keywords: ['format', 'save draft', 'draft print', 'finalize', 'reprint'],
        },
        {
            title: 'PDF output',
            body: 'Desktop can download a PDF directly. Browser builds use print preview and Save as PDF.',
            keywords: ['download as pdf', 'save as pdf', 'print preview'],
        },
    ],
    reports: [
        {
            title: 'Review and export',
            body: 'Choose a report, apply filters, and export or print the matching rows. Empty results mean nothing matched the current filters.',
            keywords: ['filter', 'export', 'print', 'empty results'],
        },
    ],
    builder: [
        {
            title: 'Configure document formats',
            body: 'Work through format, fields, layout, line items, calculations, print, field preview, and print preview.',
            keywords: ['fields', 'line items', 'templates', 'preview', 'assets'],
        },
    ],
    settings: [
        {
            title: 'Manage VaultBill',
            body: 'Business, security, backup, and secrets sit on one page with jump links. Secrets use flexible key/value settings with a short description.',
            keywords: [
                'branding',
                'themes',
                'operators',
                'printers',
                'backup',
                'security',
                'secrets',
                'json',
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
                ? 'You can use Document builder and system configuration tools.'
                : `You are signed in as ${role}. Features outside your access level remain unavailable.`,
        keywords: ['permission', 'role', role],
    };

    return [
        ...(pageSections[page] ?? pageSections.dashboard ?? []),
        roleSection,
        ...platformHelp(capabilities),
    ];
};
