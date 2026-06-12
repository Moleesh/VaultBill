/** @format */

import type { KeyboardEvent, SetStateAction } from 'react';

import {
    applyDocumentCalculations,
    calculateConfiguredLineItem,
    calculateItemAmount,
    toEditableRecord,
} from './RecordsPageSupport';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';

type ActionState = 'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint';

/**
 * Updates the selected record line item and recalculates document totals in one pass.
 */
export const updateRecordLineItem = (
    record: EditableRecord,
    activeConfig: Parameters<typeof applyDocumentCalculations>[1],
    rowId: string,
    changes: Partial<RecordLineItem>,
): EditableRecord => {
    const lineItems = record.lineItems.map((item) => {
        if (item.rowId !== rowId) return item;
        const nextItem = { ...item, ...changes };
        return calculateConfiguredLineItem(
            { ...nextItem, amount: calculateItemAmount(nextItem) },
            activeConfig,
        );
    });
    const grandTotal = lineItems
        .reduce((total, item) => total + (Number.parseFloat(item.amount) || 0), 0)
        .toFixed(2);
    return applyDocumentCalculations({ ...record, lineItems, grandTotal }, activeConfig);
};

/**
 * Moves focus between entry fields while preserving Enter and Shift+Enter keyboard flow.
 */
export const handleRecordEntryNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
        event.key !== 'Enter' ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLButtonElement
    ) {
        return;
    }
    const form = event.currentTarget;
    const focusable = [
        ...form.querySelectorAll<HTMLElement>(
            'input:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), button:not(:disabled)',
        ),
        ...document.querySelectorAll<HTMLElement>('.action-bar button:not(:disabled)'),
    ];
    const currentIndex = focusable.indexOf(event.target as HTMLElement);
    if (focusable.length === 0 || currentIndex < 0) return;
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
    event.preventDefault();
    focusable[nextIndex]?.focus();
};

/**
 * Routes the selected record into reprint mode and clears the search query.
 */
export const selectRecordForReprint = (
    selected: AppRecord,
    setRecord: (value: EditableRecord) => void,
    setActionState: (value: SetStateAction<ActionState>) => void,
    setSearchQuery: (value: string) => void,
) => {
    setRecord(toEditableRecord(selected));
    setActionState('Reprint');
    setSearchQuery('');
};
