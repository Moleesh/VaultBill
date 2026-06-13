/** @format */

import { describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../capability/Capability.types';
import { getHelpSections } from './HelpContent';

const desktopCapabilities: CapabilityRegistry = {
    isDesktop: true,
    isLanBrowser: false,
    isDemoMode: false,
    canListPrinters: true,
    canSelectExactPrinter: true,
    canBrowserPrint: true,
    canDownloadPdf: true,
    canBackup: true,
    canRestore: true,
    canUsbSignaturePad: true,
    canLanServer: true,
    canSmsIntegration: true,
    canGspIntegration: true,
    hasLocalDb: true,
};

describe('HelpContent', () => {
    it('describes the current settings and builder surfaces', () => {
        const settingsSections = getHelpSections('settings', 'SysAdmin', desktopCapabilities);
        const builderSections = getHelpSections('builder', 'SysAdmin', desktopCapabilities);

        expect(settingsSections.some((section) => section.body.includes('secrets'))).toBe(true);
        expect(builderSections.some((section) => section.body.includes('field preview'))).toBe(
            true,
        );
    });
});
