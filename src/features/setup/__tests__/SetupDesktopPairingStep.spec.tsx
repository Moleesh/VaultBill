/** @format */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const androidPairingMocks = vi.hoisted(() => ({
    readAndroidPairingSettings: vi.fn(),
    saveAndroidPairingSettings: vi.fn(),
    scanAndroidPairingHosts: vi.fn(),
}));

vi.mock('../../../runtime/AndroidPairing', () => ({
    readAndroidPairingSettings: androidPairingMocks.readAndroidPairingSettings,
    saveAndroidPairingSettings: androidPairingMocks.saveAndroidPairingSettings,
    scanAndroidPairingHosts: androidPairingMocks.scanAndroidPairingHosts,
}));

import { SetupDesktopPairingStep } from '../SetupDesktopPairingStep';

describe('SetupDesktopPairingStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        androidPairingMocks.readAndroidPairingSettings.mockReturnValue({
            enabled: false,
            hostTarget: 'http://127.0.0.1:80/VaultBill/',
            connectionStatus: 'unknown',
            discoveredHosts: [],
        });
        androidPairingMocks.scanAndroidPairingHosts.mockResolvedValue([
            'http://192.168.1.10:80/VaultBill/',
        ]);
    });

    it('loads saved pairing data and saves desktop pairing when requested', async () => {
        const onContinue = vi.fn();

        render(<SetupDesktopPairingStep onContinue={onContinue} />);

        expect(await screen.findByDisplayValue('http://127.0.0.1:80/VaultBill/')).toBeVisible();
        fireEvent.change(screen.getByLabelText('Desktop host'), {
            target: { value: '192.168.1.10:80' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Use desktop host' }));

        await waitFor(() => {
            expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenCalledWith({
                enabled: true,
                hostTarget: '192.168.1.10:80',
                connectionStatus: 'unknown',
                discoveredHosts: [],
            });
        });
        expect(onContinue).toHaveBeenCalledTimes(1);
    });

    it('scans for hosts and lets the operator skip into local mobile mode', async () => {
        const onContinue = vi.fn();

        render(<SetupDesktopPairingStep onContinue={onContinue} />);

        fireEvent.click(screen.getByRole('button', { name: 'Scan LAN' }));
        expect(await screen.findByText('Choose a desktop host below.')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'http://192.168.1.10:80/VaultBill/' }));
        expect(screen.getByDisplayValue('http://192.168.1.10:80/VaultBill/')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Skip for local mobile' }));

        await waitFor(() => {
            expect(androidPairingMocks.saveAndroidPairingSettings).toHaveBeenLastCalledWith({
                enabled: false,
                hostTarget: '',
                connectionStatus: 'disconnected',
                discoveredHosts: ['http://192.168.1.10:80/VaultBill/'],
            });
        });
        expect(onContinue).toHaveBeenCalledTimes(1);
    });
});
