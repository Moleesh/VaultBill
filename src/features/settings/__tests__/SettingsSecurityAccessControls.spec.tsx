/** @format */

import type { ReactElement } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsSecurityAccess } from '../SettingsSecurityAccess';

vi.mock('../../../runtime/AndroidPairing', () => ({
    readAndroidPairingSettings: vi.fn(() => ({
        enabled: false,
        hostTarget: '',
        connectionStatus: 'unknown',
        discoveredHosts: [],
    })),
    saveAndroidPairingSettings: vi.fn(),
    scanAndroidPairingHosts: vi.fn(),
    testAndroidPairingHost: vi.fn(),
}));

const activationForm = {
    Field: () => null,
    state: { values: { licenseKey: '' } },
} as unknown as Parameters<typeof SettingsSecurityAccess>[0]['activationForm'];

const renderAccess = (props: Partial<Parameters<typeof SettingsSecurityAccess>[0]> = {}) => {
    const defaultProps = {
        activationForm,
        canLanServer: false,
        hostedWebAutoStart: false,
        hostedWebServerRunning: false,
        isDemoMode: false,
        isSysAdmin: true,
        lanEnabled: false,
        onActivateLicense: vi.fn(),
        onHostedWebAutoStartChange: vi.fn(),
        onLanEnabledChange: vi.fn(),
        onResetTrial: vi.fn(),
        onRestartHostedWebServer: vi.fn(),
        onStartHostedWebServer: vi.fn(),
        onStopHostedWebServer: vi.fn(),
        runtimePlatform: 'desktop',
        trialStatus: {
            isFullVersion: true,
            isExpired: false,
            remainingSeconds: 0,
        },
    } satisfies Parameters<typeof SettingsSecurityAccess>[0];

    return render(<SettingsSecurityAccess {...defaultProps} {...props} />);
};

describe('SettingsSecurityAccess controls', () => {
    it('renders hosted web controls for desktop sysadmins', () => {
        const onLanEnabledChange = vi.fn();
        const onHostedWebAutoStartChange = vi.fn();
        const onStartHostedWebServer = vi.fn();

        renderAccess({
            canLanServer: true,
            onHostedWebAutoStartChange,
            onLanEnabledChange,
            onStartHostedWebServer,
        });

        fireEvent.click(screen.getByLabelText('Keep hosted web access on this computer only'));
        fireEvent.click(
            screen.getByLabelText('Start hosted web automatically when VaultBill opens'),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Start hosted web' }));

        expect(onLanEnabledChange).toHaveBeenCalledWith(true);
        expect(onHostedWebAutoStartChange).toHaveBeenCalledWith(true);
        expect(onStartHostedWebServer).toHaveBeenCalled();
        expect(screen.getByText('Hosted web is currently stopped.')).toBeVisible();
    });

    it('uses the active hosted-web controls when the server is running', () => {
        const onRestartHostedWebServer = vi.fn();
        const onStopHostedWebServer = vi.fn();

        renderAccess({
            canLanServer: true,
            hostedWebAutoStart: true,
            hostedWebServerRunning: true,
            lanEnabled: true,
            onRestartHostedWebServer,
            onStopHostedWebServer,
        });

        fireEvent.click(screen.getByRole('button', { name: 'Stop hosted web' }));
        fireEvent.click(screen.getByRole('button', { name: 'Restart hosted web' }));

        expect(onStopHostedWebServer).toHaveBeenCalled();
        expect(onRestartHostedWebServer).toHaveBeenCalled();
        expect(screen.getByText('Hosted web is currently running.')).toBeVisible();
    });

    it('enables activation when a license key is present', () => {
        const onActivateLicense = vi.fn();
        const activationFormWithKey = {
            Field: ({
                children,
            }: {
                children: (field: {
                    handleChange: (value: string) => void;
                    state: { value: string };
                }) => ReactElement;
            }) =>
                children({
                    handleChange: vi.fn(),
                    state: { value: 'VB-123' },
                }),
            state: { values: { licenseKey: 'VB-123' } },
        } as unknown as Parameters<typeof SettingsSecurityAccess>[0]['activationForm'];

        renderAccess({
            activationForm: activationFormWithKey,
            onActivateLicense,
            trialStatus: {
                isFullVersion: false,
                isExpired: true,
                remainingSeconds: 0,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Activate full version' }));

        expect(onActivateLicense).toHaveBeenCalled();
        expect(screen.getByLabelText('License key')).toHaveValue('VB-123');
    });
});
