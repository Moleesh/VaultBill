/** @format */

import { BarChart3, BookOpenText, FileText, Settings, SlidersHorizontal } from 'lucide-react';

import type { AppRouteId, Role } from '../types/AppTypes';
import { shellSections } from '../constants/PhaseOneSeed';

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
