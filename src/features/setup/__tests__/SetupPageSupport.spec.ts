/** @format */

import { describe, expect, it } from 'vitest';

import {
    androidSetupSteps,
    getAdminAccessValidationMessage,
    getBusinessProfileValidationMessage,
    localHostedOrigins,
    setupErrorMessage,
    setupSteps,
} from '../SetupPageSupport';

describe('SetupPageSupport', () => {
    it('exposes desktop and Android setup step sequences', () => {
        expect(setupSteps.map((step) => step.label)).toEqual([
            'Welcome',
            'Workspace Details',
            'Admin Access',
        ]);
        expect(androidSetupSteps.map((step) => step.label)).toEqual([
            'Welcome',
            'Connect to desktop',
            'Workspace Details',
            'Admin Access',
        ]);
    });

    it('identifies local hosted origins used by setup handoff', () => {
        expect(localHostedOrigins.has('localhost')).toBe(true);
        expect(localHostedOrigins.has('127.0.0.1')).toBe(true);
        expect(localHostedOrigins.has('[::1]')).toBe(true);
        expect(localHostedOrigins.has('vaultbill.example.com')).toBe(false);
    });

    it('strips Electron IPC prefixes from setup errors and falls back for unknown values', () => {
        expect(
            setupErrorMessage(
                new Error(
                    "Error invoking remote method 'vaultbill:setup:complete': Error: Setup failed.",
                ),
            ),
        ).toBe('Setup failed.');
        expect(setupErrorMessage(new Error('Error: Plain failure.'))).toBe('Plain failure.');
        expect(setupErrorMessage('unexpected')).toBe('Setup could not be completed.');
    });

    it('returns the right validation copy for business and admin setup inputs', () => {
        expect(
            getBusinessProfileValidationMessage({
                companyName: '   ',
                address: '   ',
            }),
        ).toBe('Business name and address are required to continue.');
        expect(
            getBusinessProfileValidationMessage({
                companyName: 'VaultBill',
                address: '   ',
            }),
        ).toBe('Business address is required to continue.');
        expect(
            getBusinessProfileValidationMessage({
                companyName: '   ',
                address: '42 Market Street',
            }),
        ).toBe('Business name is required to continue.');
        expect(
            getAdminAccessValidationMessage({
                adminDisplayName: '   ',
                adminUsername: '   ',
            }),
        ).toBe('Admin display name and username are required.');
        expect(
            getAdminAccessValidationMessage({
                adminDisplayName: '   ',
                adminUsername: 'opsadmin',
            }),
        ).toBe('Admin display name is required.');
        expect(
            getAdminAccessValidationMessage({
                adminDisplayName: 'Ops Admin',
                adminUsername: '   ',
            }),
        ).toBe('Admin username is required.');
    });
});
