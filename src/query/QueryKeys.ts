/** @format */

import type { CapabilityRegistry } from '../capability/Capability.types';

export type RuntimeQueryScope = 'desktop' | 'hosted-web' | 'static-hosted-browser' | 'browser';

export const getRuntimeQueryScope = (
    capabilities: Pick<CapabilityRegistry, 'isDesktop' | 'isHostedWeb' | 'isDemoMode'>,
): RuntimeQueryScope => {
    if (capabilities.isDesktop || window.vaultBillDesktop) return 'desktop';
    if (capabilities.isHostedWeb) return 'hosted-web';
    if (capabilities.isDemoMode) return 'static-hosted-browser';
    return 'browser';
};

export const queryKeys = {
    setupStatus: (scope: RuntimeQueryScope) => ['runtime', scope, 'setup-status'] as const,
    setupDefaults: (scope: RuntimeQueryScope) => ['runtime', scope, 'setup-defaults'] as const,
    session: (scope: RuntimeQueryScope) => ['runtime', scope, 'session'] as const,
    trialStatus: (scope: RuntimeQueryScope, accountUserId: string) =>
        ['runtime', scope, 'trial-status', accountUserId] as const,
    hostedWebUrl: (scope: RuntimeQueryScope) => ['runtime', scope, 'hosted-web-url'] as const,
    securityRuntimeState: (scope: RuntimeQueryScope) =>
        ['runtime', scope, 'security-runtime-state'] as const,
    workspaceSettings: (scope: RuntimeQueryScope) =>
        ['runtime', scope, 'workspace-settings'] as const,
    workspacePrinters: (scope: RuntimeQueryScope) =>
        ['runtime', scope, 'workspace-printers'] as const,
    publishedFormats: (scope: RuntimeQueryScope) =>
        ['runtime', scope, 'published-formats'] as const,
    records: (scope: RuntimeQueryScope) => ['runtime', scope, 'records'] as const,
    builderInventory: (scope: RuntimeQueryScope) =>
        ['runtime', scope, 'builder-inventory'] as const,
    builderPackage: (scope: RuntimeQueryScope, formatId: string) =>
        ['runtime', scope, 'builder-package', formatId] as const,
    reportResults: (scope: RuntimeQueryScope, query: Readonly<Record<string, unknown>>) =>
        ['runtime', scope, 'report-results', query] as const,
    secretsSettings: (scope: RuntimeQueryScope) => ['runtime', scope, 'secrets-settings'] as const,
};
