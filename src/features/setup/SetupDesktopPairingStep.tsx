/** @format */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { ServerCog } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import {
    readAndroidPairingSettings,
    saveAndroidPairingSettings,
    scanAndroidPairingHosts,
} from '../../runtime/AndroidPairing';

type SetupDesktopPairingStepProps = {
    readonly onContinue: () => void;
};

/** Optional Android-first setup step for connecting to a desktop host. */
export const SetupDesktopPairingStep: FC<SetupDesktopPairingStepProps> = ({ onContinue }) => {
    const [hostTarget, setHostTarget] = useState('http://127.0.0.1:80/VaultBill/');
    const [message, setMessage] = useState('');
    const [discoveredHosts, setDiscoveredHosts] = useState<readonly string[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const settings = readAndroidPairingSettings();
        if (settings.hostTarget) setHostTarget(settings.hostTarget);
        setDiscoveredHosts(settings.discoveredHosts);
    }, []);

    const savePairing = (enabled: boolean) => {
        saveAndroidPairingSettings({
            enabled,
            hostTarget: enabled ? hostTarget.trim() : '',
            connectionStatus: enabled ? 'unknown' : 'disconnected',
            discoveredHosts,
        });
        setMessage(
            enabled
                ? 'Desktop pairing saved for this device.'
                : 'Using this device as a local mobile workspace.',
        );
        onContinue();
    };

    const scanForHosts = () => {
        setIsScanning(true);
        setMessage('Scanning for VaultBill Desktop hosts...');
        void scanAndroidPairingHosts(hostTarget)
            .then((hosts) => {
                setDiscoveredHosts(hosts);
                setMessage(
                    hosts.length ? 'Choose a desktop host below.' : 'No desktop host found.',
                );
                saveAndroidPairingSettings({
                    enabled: false,
                    hostTarget,
                    connectionStatus: 'unknown',
                    discoveredHosts: hosts,
                });
            })
            .finally(() => {
                setIsScanning(false);
            });
    };

    return (
        <div className="setup-connect-step">
            <div className="section-heading">
                <div>
                    <h3>Connect to desktop</h3>
                    <p>
                        Pair this mobile workspace with a running VaultBill Desktop host, or skip
                        and keep a separate local mobile workspace.
                    </p>
                </div>
                <ServerCog aria-hidden="true" />
            </div>
            <FormField.TextField
                label="Desktop host"
                onChange={(event) => {
                    setHostTarget(event.currentTarget.value);
                }}
                placeholder="http://192.168.1.10:80/VaultBill/"
                value={hostTarget}
            />
            <p className="field-note">
                Pairing does not sync data. If you skip, this mobile runtime uses its own local DB
                and you can pair later from SysAdmin Settings.
            </p>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
            {discoveredHosts.length ? (
                <div className="operator-create">
                    {discoveredHosts.map((host) => (
                        <ActionButton
                            key={host}
                            onClick={() => {
                                setHostTarget(host);
                            }}
                        >
                            {host}
                        </ActionButton>
                    ))}
                </div>
            ) : null}
            <div className="operator-create">
                <ActionButton disabled={isScanning} onClick={scanForHosts} variant="secondary">
                    {isScanning ? 'Scanning...' : 'Scan LAN'}
                </ActionButton>
                <ActionButton
                    disabled={!hostTarget.trim()}
                    onClick={() => {
                        savePairing(true);
                    }}
                    variant="primary"
                >
                    Use desktop host
                </ActionButton>
                <ActionButton
                    onClick={() => {
                        savePairing(false);
                    }}
                    variant="secondary"
                >
                    Skip for local mobile
                </ActionButton>
            </div>
        </div>
    );
};
