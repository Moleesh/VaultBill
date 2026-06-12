/** @format */

/**
 * Exercises the record-entry keyboard flow and the reprint selection helper
 * that route the user through the main record actions.
 */

import { describe, expect, it, vi } from 'vitest';

import { createEmptyRecord, toEditableRecord } from './RecordsPageSupport';
import { handleRecordEntryNavigation, selectRecordForReprint } from './RecordsPageActionsSupport';

describe('RecordsPageActionsSupport', () => {
    it('moves focus with Enter and Shift+Enter inside the record form', () => {
        const first = document.createElement('input');
        const second = document.createElement('input');
        const action = document.createElement('button');
        const form = document.createElement('div');
        form.append(first, second);
        document.body.append(form, action);

        const preventDefault = vi.fn();
        const event = {
            key: 'Enter',
            target: first,
            currentTarget: form,
            shiftKey: false,
            preventDefault,
        } as never;

        handleRecordEntryNavigation(event);
        expect(document.activeElement).toBe(second);
        expect(preventDefault).toHaveBeenCalledOnce();
    });

    it('routes the selected record into reprint mode', () => {
        const record = toEditableRecord({
            ...createEmptyRecord(),
            customerName: 'Acme',
        } as never);
        const setRecord = vi.fn();
        const setActionState = vi.fn();
        const setSearchQuery = vi.fn();

        selectRecordForReprint(record as never, setRecord, setActionState, setSearchQuery);

        expect(setRecord).toHaveBeenCalledWith(expect.objectContaining({ customerName: 'Acme' }));
        expect(setActionState).toHaveBeenCalledWith('Reprint');
        expect(setSearchQuery).toHaveBeenCalledWith('');
    });
});
