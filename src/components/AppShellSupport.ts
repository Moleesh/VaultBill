/** @format */

import { BarChart3, BookOpenText, FileText, Settings, SlidersHorizontal } from 'lucide-react';

import { shellSections } from '../constants/RuntimeDefaults';
import type { AppRouteId, Role } from '../types/AppTypes';

const desktopLastAppTabStorageKey = 'vaultbill.desktop.last-app-tab';
const desktopLogoutFreshLoginSessionKey = 'vaultbill.desktop.logout-fresh-login';

export type DesktopTrialStatus = Awaited<
    ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>
>;

export const appShellIcons = {
    dashboard: BarChart3,
    records: FileText,
    reports: BookOpenText,
    builder: SlidersHorizontal,
    settings: Settings,
} as const;

export const getPageId = (pathname: string): AppRouteId => {
    const routeId = pathname.split('/').filter(Boolean)[1];
    return (
        shellSections.some((section) => section.id === routeId) ? routeId : 'dashboard'
    ) as AppRouteId;
};

export const getAllowedSectionIds = (isDemoMode: boolean, role: Role) =>
    isDemoMode
        ? new Set<AppRouteId>(['dashboard', 'records', 'reports'])
        : role === 'SysAdmin'
          ? new Set<AppRouteId>(['dashboard', 'records', 'reports', 'builder', 'settings'])
          : role === 'Admin'
            ? new Set<AppRouteId>(['dashboard', 'records', 'reports', 'settings'])
            : new Set<AppRouteId>(['records', 'reports']);

/** Returns the first route each role can actually use after sign-in. */
export const getDefaultAppRouteForRole = (role: Role): AppRouteId =>
    role === 'User' ? 'records' : 'dashboard';

/** Builds the canonical shell tab path for a top-level route id. */
export const getAppTabPath = (routeId: AppRouteId): string => `/app/${routeId}`;

/** Extracts the app tab id from nested paths such as /app/records/new. */
export const getAppRouteIdFromPath = (pathname: string): AppRouteId | undefined => {
    const [, appSegment, routeSegment] = pathname.split('/');
    if (appSegment !== 'app') return undefined;
    return shellSections.some((section) => section.id === routeSegment)
        ? (routeSegment as AppRouteId)
        : undefined;
};

/** Keeps reload/login restoration on an allowed tab for the active role. */
export const getSafeAppPathForRole = (role: Role, targetPath?: string): string => {
    const routeId = targetPath ? getAppRouteIdFromPath(targetPath) : undefined;
    if (routeId && getAllowedSectionIds(false, role).has(routeId)) {
        return targetPath ?? `/app/${routeId}`;
    }
    return getAppTabPath(getDefaultAppRouteForRole(role));
};

/** Clears the legacy desktop tab memory so logout/login starts from the role default. */
export const clearDesktopLastAppTab = (): void => {
    try {
        window.localStorage.removeItem(desktopLastAppTabStorageKey);
    } catch {
        // Ignore storage failures and continue with normal role-based landing routes.
    }
};

/** Marks the next desktop login as an intentional post-logout fresh start. */
export const markDesktopLogoutFreshLogin = (): void => {
    try {
        window.sessionStorage.setItem(desktopLogoutFreshLoginSessionKey, 'true');
    } catch {
        // Ignore storage failures and fall back to route state only.
    }
};

/** Reads whether the current login screen was reached from an explicit logout. */
export const consumeDesktopLogoutFreshLogin = (): boolean => {
    try {
        const shouldReset = window.sessionStorage.getItem(desktopLogoutFreshLoginSessionKey);
        return shouldReset === 'true';
    } catch {
        return false;
    }
};

/** Clears the explicit logout marker once a fresh login path has been chosen. */
export const clearDesktopLogoutFreshLogin = (): void => {
    try {
        window.sessionStorage.removeItem(desktopLogoutFreshLoginSessionKey);
    } catch {
        // Ignore storage failures and continue with normal route selection.
    }
};
