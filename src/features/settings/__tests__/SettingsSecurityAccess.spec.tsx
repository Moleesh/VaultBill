/** @format */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsSecurityAccess } from '../SettingsSecurityAccess';

const androidPairingMocks = vi.hoisted(() => ({
    readAndroidPairingSettings: vi.fn(),
    saveAndroidPairingSettings: vi.fn(),
    scanAndroidPairingHosts: vi.fn(),
    testAndroidPairingHost: vi.fn(),
}));

vi.mock('../../../runtime/AndroidPairing', () => ({
    readAndroidPairingSettings: androidPairingMocks.readAndroidPairingSettings,
    saveAndroidPairingSettings: androidPairingMocks.saveAndroidPairingSettings,
    scanAndroidPairingHosts: androidPairingMocks.scanAndroidPairingHosts,
    testAndroidPairingHost: androidPairingMocks.testAndroidPairingHost,
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
        runtimePlatform: 'android-local',
        trialStatus: {
            isFullVersion: true,
            isExpired: false,
            remainingSeconds: 0,
        },
    } satisfies Parameters<typeof SettingsSecurityAccess>[0];

    return render(<SettingsSecurityAccess {...defaultProps} {...props} />);
};

describe('SettingsSecurityAccess Android pairing', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        vi.clearAllMocks();
        androidPairingMocks.readAndroidPairingSettings.mockReturnValue({
            enabled: false,
            hostTarget: '',
            connectionStatus: 'unknown',
            discoveredHosts: [],
        });
        androidPairingMocks.scanAndroidPairingHosts.mockResolvedValue([
            'http://192.168.1.10:80/VaultBill/',
        ]);
        androidPairingMocks.testAndroidPairingHost.mockResolvedValue(
            'http://192.168.1.10:80/VaultBill/',
        );
    });

    it('tests a manual Android host before saving and can return to standalone mode', async () => {
        renderAccess();

        fireEvent.change(screen.getByLabelText('Desktop host'), {
            target: { value: '192.168.1.10:80' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Test and save pairing' }));

        await waitFor(() => {
            expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenCalledWith({
                enabled: true,
                hostTarget: 'http://192.168.1.10:80/VaultBill/',
                connectionStatus: 'connected',
                discoveredHosts: [],
            });
        });
        expect(screen.getByText('Android is paired to this VaultBill Desktop host.')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Use local mobile' }));

        expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenLastCalledWith({
            enabled: false,
            hostTarget: '',
            connectionStatus: 'disconnected',
            discoveredHosts: [],
        });
    });

    it('scans for same-network desktop hosts before pairing', async () => {
        renderAccess();

        fireEvent.click(screen.getByRole('button', { name: 'Scan LAN' }));

        expect(
            await screen.findByRole('button', { name: 'http://192.168.1.10:80/VaultBill/' }),
        ).toBeVisible();
        expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenCalledWith({
            enabled: false,
            hostTarget: '',
            connectionStatus: 'connected',
            discoveredHosts: ['http://192.168.1.10:80/VaultBill/'],
        });
    });

    it('keeps Android in standalone mode when the desktop host is unreachable', async () => {
        androidPairingMocks.testAndroidPairingHost.mockResolvedValue(undefined);
        renderAccess();

        fireEvent.change(screen.getByLabelText('Desktop host'), {
            target: { value: '192.168.1.99:80' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Test and save pairing' }));

        expect(
            await screen.findByText(
                'Could not reach VaultBill Desktop. Check the address and same-network access.',
            ),
        ).toBeVisible();
        expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenCalledWith({
            enabled: false,
            hostTarget: '192.168.1.99:80',
            connectionStatus: 'disconnected',
            discoveredHosts: [],
        });
    });

    it('confirms trial reset through the app dialog', async () => {
        const onResetTrial = vi.fn();

        renderAccess({
            onResetTrial,
            runtimePlatform: 'desktop',
            trialStatus: {
                isFullVersion: true,
                isExpired: false,
                remainingSeconds: 0,
            },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Reset trial' }));
        fireEvent.click(
            within(await screen.findByRole('dialog', { name: 'Reset trial?' })).getByRole(
                'button',
                { name: 'Reset trial' },
            ),
        );

        expect(onResetTrial).toHaveBeenCalled();
    });
});
