/** @format */

import { useEffect, useMemo, useState, type FC } from 'react';

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
    const isSysAdmin = operatorContext?.role === 'SysAdmin';
    const sections = useMemo(
        () =>
            [
                isSysAdmin ? { id: 'business', label: 'Business' } : null,
                { id: 'security', label: 'Security' },
                isSysAdmin && (capabilities.isDesktop || capabilities.isHostedWeb)
                    ? { id: 'backup', label: 'Backup' }
                    : null,
                isSysAdmin ? { id: 'secrets', label: 'Secrets' } : null,
            ].filter((section): section is { id: string; label: string } => section !== null),
        [capabilities.isDesktop, capabilities.isHostedWeb, isSysAdmin],
    );
    const [activeSectionId, setActiveSectionId] = useState(() => {
        const hashSectionId = window.location.hash.replace(/^#/u, '');
        return hashSectionId || (sections[0]?.id ?? 'security');
    });

    useEffect(() => {
        const validSectionIds = new Set(sections.map((section) => section.id));
        const hashSectionId = window.location.hash.replace(/^#/u, '');

        if (hashSectionId && validSectionIds.has(hashSectionId)) {
            setActiveSectionId(hashSectionId);
            return;
        }

        setActiveSectionId(sections[0]?.id ?? 'security');
    }, [sections]);

    if (!operatorContext) return null;

    return (
        <div className="page-stack settings-page">
            <div className="operational-header">
                <div>
                    <p className="eyebrow">{isSysAdmin ? 'Administration' : 'Access'}</p>
                    <h1>{isSysAdmin ? 'Workspace administration' : 'Account access'}</h1>
                    <p>
                        {isSysAdmin
                            ? 'Business, security, backups, and secrets in one focused workspace.'
                            : 'Manage User accounts and your own password.'}
                    </p>
                </div>
            </div>
            <nav className="settings-jump-links" aria-label="Settings sections">
                {sections.map((section) => (
                    <a
                        aria-current={activeSectionId === section.id ? 'page' : undefined}
                        href={`#${section.id}`}
                        key={section.id}
                        onClick={() => {
                            setActiveSectionId(section.id);
                        }}
                    >
                        {section.label}
                    </a>
                ))}
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
