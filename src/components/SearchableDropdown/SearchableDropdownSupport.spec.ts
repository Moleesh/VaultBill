/** @format */

import { describe, expect, it } from 'vitest';

import { getDropdownMenuPlacement, normalizeDropdownSearch } from './SearchableDropdownSupport';

describe('SearchableDropdownSupport', () => {
    it('normalizes whitespace and case for searches', () => {
        expect(normalizeDropdownSearch('  Local   GSP  Helper ')).toBe('local gsp helper');
    });

    it('keeps the dropdown below the trigger when there is workable space', () => {
        const placement = getDropdownMenuPlacement(
            {
                top: 120,
                bottom: 160,
                left: 24,
                width: 320,
            } as DOMRect,
            900,
            1280,
        );

        expect(placement.openDirection).toBe('below');
        expect(placement.top).toBe('168px');
        expect(placement.width).toBe('320px');
    });

    it('opens above only when there is very little room below the trigger', () => {
        const placement = getDropdownMenuPlacement(
            {
                top: 760,
                bottom: 800,
                left: 24,
                width: 240,
            } as DOMRect,
            840,
            1280,
        );

        expect(placement.openDirection).toBe('above');
        expect(Number.parseInt(placement.top, 10)).toBeLessThan(760);
        expect(placement.width).toBe('280px');
    });
});
