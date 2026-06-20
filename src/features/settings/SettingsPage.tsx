/** @format */

import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { useSession } from '../auth/SessionContext';
import { SettingsBackupSection } from './SettingsBackupSection';
import { SettingsBusinessSection } from './SettingsBusinessSection';
import { SettingsSecretsSection } from './SettingsSecretsSection';
import { SettingsSecuritySection } from './SettingsSecuritySection';

/** Routes the current operator to the settings sessions they can use. */
export const SettingsPage: FC = () => {
    const capabilities = useCapabilities();
    const { operatorContext } = useSession();
    if (!operatorContext) return null;
    const isSysAdmin = operatorContext.role === 'SysAdmin';

    return (
        <div className="page-stack settings-page">
            <div className="operational-header">
                <div>
                    <p className="eyebrow">Settings</p>
                    <h1>{isSysAdmin ? 'Administration settings' : 'Operator settings'}</h1>
                    <p>
                        {isSysAdmin
                            ? 'Business, security, backups, and secrets in one focused workspace.'
                            : 'Manage User accounts and your own password.'}
                    </p>
                </div>
            </div>
            <nav className="settings-jump-links" aria-label="Settings sections">
                {isSysAdmin ? <a href="#business">Business</a> : null}
                <a href="#security">Security</a>
                {isSysAdmin && (capabilities.isDesktop || capabilities.isHostedWeb) ? (
                    <a href="#backup">Backup</a>
                ) : null}
                {isSysAdmin ? <a href="#secrets">Secrets</a> : null}
            </nav>
            {isSysAdmin ? <SettingsBusinessSection /> : null}
            <SettingsSecuritySection />
            {isSysAdmin && (capabilities.isDesktop || capabilities.isHostedWeb) ? (
                <SettingsBackupSection />
            ) : null}
            {isSysAdmin ? <SettingsSecretsSection /> : null}
        </div>
    );
};
