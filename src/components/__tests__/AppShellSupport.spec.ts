/** @format */

import { describe, expect, it } from 'vitest';

import { shellSections } from '../../constants/RuntimeDefaults';
import type { AppRouteId } from '../../types/AppTypes';
import {
    appShellIcons,
    getAllowedSectionIds,
    getPageId,
    getSafeAppPathForRole,
} from '../AppShellSupport';

describe('AppShellSupport', () => {
    it('resolves the current page from the route path', () => {
        expect(getPageId('/app/records')).toBe('records');
        expect(getPageId('/app/does-not-exist')).toBe('dashboard');
    });

    it('limits navigation by mode and role', () => {
        expect(getAllowedSectionIds(true, 'Admin')).toEqual(
            new Set<AppRouteId>(['dashboard', 'records', 'reports']),
        );
        expect(getAllowedSectionIds(false, 'SysAdmin')).toEqual(
            new Set<AppRouteId>(['dashboard', 'builder', 'settings']),
        );
        expect(getAllowedSectionIds(false, 'User')).toEqual(
            new Set<AppRouteId>(['records', 'reports']),
        );
    });

    it('keeps restored sessions on a safe requested tab', () => {
        expect(getSafeAppPathForRole('Admin', '/app/records/new')).toBe('/app/records/new');
        expect(getSafeAppPathForRole('User', '/app/dashboard')).toBe('/app/records');
        expect(getSafeAppPathForRole('SysAdmin', '/app/reports')).toBe('/app/dashboard');
    });

    it('exposes icons for each top-level shell section', () => {
        expect(Object.keys(appShellIcons)).toEqual(shellSections.map((section) => section.id));
    });
});
