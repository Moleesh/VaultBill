/** @format */

import { BarChart3, BookOpenText, FileText, Settings, SlidersHorizontal } from 'lucide-react';

import { shellSections } from '../constants/RuntimeDefaults';
import type { AppRouteId, Role } from '../types/AppTypes';

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
          ? new Set<AppRouteId>(['dashboard', 'builder', 'settings'])
          : role === 'Admin'
            ? new Set<AppRouteId>(['dashboard', 'records', 'reports', 'settings'])
            : new Set<AppRouteId>(['records', 'reports']);

/** Returns the first route each role can actually use after sign-in. */
export const getDefaultAppRouteForRole = (role: Role): AppRouteId =>
    role === 'User' ? 'records' : 'dashboard';

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
    return `/app/${getDefaultAppRouteForRole(role)}`;
};
