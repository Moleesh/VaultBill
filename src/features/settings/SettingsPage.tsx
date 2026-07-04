/** @format */

import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { useSession } from '../auth/SessionContext';
import { SettingsBackupSection } from './SettingsBackupSection';
import { SettingsBusinessSection } from './SettingsBusinessSection';
import { SettingsSecretsSection } from './SettingsSecretsSection';
import { SettingsSecuritySection } from './SettingsSecuritySection';

/** Routes the current operator to the settings sections they can use. */
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
    const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);

    useEffect(() => {
        const validSectionIds = new Set(sectionIds);
        const hashSectionId = window.location.hash.replace(/^#/u, '');

        if (hashSectionId && validSectionIds.has(hashSectionId)) {
            setActiveSectionId(hashSectionId);
            return;
        }

        setActiveSectionId(sections[0]?.id ?? 'security');
    }, [sectionIds, sections]);

    useEffect(() => {
        const handleHashChange = () => {
            const hashSectionId = window.location.hash.replace(/^#/u, '');
            if (sections.some((section) => section.id === hashSectionId)) {
                setActiveSectionId(hashSectionId);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [sections]);

    useEffect(() => {
        if (typeof window.IntersectionObserver !== 'function') return;
        const sectionElements = sectionIds
            .map((sectionId) => document.getElementById(sectionId))
            .filter((element): element is HTMLElement => element !== null);
        if (sectionElements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((left, right) => right.intersectionRatio - left.intersectionRatio);
                const nextSectionId = visibleEntries[0]?.target.id;
                if (nextSectionId) {
                    setActiveSectionId((currentSectionId) =>
                        currentSectionId === nextSectionId ? currentSectionId : nextSectionId,
                    );
                }
            },
            {
                root: null,
                rootMargin: '-20% 0px -55% 0px',
                threshold: [0.15, 0.35, 0.6],
            },
        );

        for (const element of sectionElements) observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [sectionIds]);

    const openSettingsSection = useCallback((sectionId: string) => {
        setActiveSectionId(sectionId);
        window.history.replaceState(null, '', `#${sectionId}`);
        document.getElementById(sectionId)?.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
        });
    }, []);

    if (!operatorContext) return null;

    return (
        <div className="page-stack settings-page">
            {sections.length > 1 ? (
                <>
                    <nav className="settings-jump-links" aria-label="Settings sections">
                        {sections.map((section) => (
                            <a
                                aria-current={activeSectionId === section.id ? 'page' : undefined}
                                href={`#${section.id}`}
                                key={section.id}
                                onClick={(event) => {
                                    event.preventDefault();
                                    openSettingsSection(section.id);
                                }}
                            >
                                {section.label}
                            </a>
                        ))}
                    </nav>
                </>
            ) : null}
            {isSysAdmin ? <SettingsBusinessSection /> : null}
            <SettingsSecuritySection />
            {isSysAdmin && (capabilities.isDesktop || capabilities.isHostedWeb) ? (
                <SettingsBackupSection />
            ) : null}
            {isSysAdmin ? <SettingsSecretsSection /> : null}
        </div>
    );
};
