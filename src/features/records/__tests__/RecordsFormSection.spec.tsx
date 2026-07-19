/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecordsFormSection } from '../RecordsFormSection';
import { createEmptyRecord, type ConfiguredFieldDefinition } from '../RecordsPageSupport';

describe('RecordsFormSection', () => {
    it.each([
        { columns: 3, gap: 16 },
        { columns: 5, gap: 16 },
    ])(
        'uses $columns columns and $gap px gap from the active document layout',
        ({ columns, gap }) => {
            render(
                <RecordsFormSection
                    configuredDocumentFields={[]}
                    configuredLineFields={[]}
                    isReadOnly={false}
                    layout={{ Columns: columns, Gap: gap }}
                    onAddLineItem={vi.fn()}
                    onRecordChange={vi.fn()}
                    onUpdateLineItem={vi.fn()}
                    record={createEmptyRecord()}
                    recordTotals={{
                        grandTotal: '0.00',
                        roundOff: '0.00',
                        subtotal: '0.00',
                        taxTotal: '0.00',
                    }}
                    selectedStoredRecord={undefined}
                />,
            );

            const grid = screen.getByLabelText('Invoice date').closest('.records-layout-grid');

            expect(grid).not.toBeNull();
            expect(grid).toHaveStyle({
                '--records-layout-columns': String(columns),
                gap: `${String(gap)}px`,
            });
        },
    );

    it('places fields after the line-item marker below line items and before totals', () => {
        const configuredDocumentFields = [
            {
                FieldId: 'BeforeLineItems',
                Label: 'Before line items',
                Type: 'Text',
                Visible: true,
            },
            {
                FieldId: 'LineItemsMarker',
                Label: 'Line marker',
                Type: 'LineItemSection',
                Visible: true,
            },
            {
                FieldId: 'AfterLineItems',
                Label: 'After line items',
                Type: 'Money',
                Visible: true,
            },
            {
                FieldId: 'HiddenAfterLineItems',
                Label: 'Hidden after line items',
                Type: 'Text',
                Visible: false,
            },
        ] satisfies readonly ConfiguredFieldDefinition[];

        const { container } = render(
            <RecordsFormSection
                configuredDocumentFields={configuredDocumentFields}
                configuredLineFields={[
                    {
                        FieldId: 'ItemName',
                        Label: 'Item Name',
                        Type: 'Text',
                        Visible: true,
                    },
                ]}
                isReadOnly={false}
                layout={{ Columns: 3, Gap: 16 }}
                onAddLineItem={vi.fn()}
                onRecordChange={vi.fn()}
                onUpdateLineItem={vi.fn()}
                record={createEmptyRecord()}
                recordTotals={{
                    grandTotal: '0.00',
                    roundOff: '0.00',
                    subtotal: '0.00',
                    taxTotal: '0.00',
                }}
                selectedStoredRecord={undefined}
            />,
        );

        const renderedText = container.textContent;

        expect(screen.getByLabelText('Before line items')).toBeVisible();
        expect(screen.getByLabelText('After line items')).toBeVisible();
        expect(screen.queryByLabelText('Line marker')).toBeNull();
        expect(screen.queryByLabelText('Hidden after line items')).toBeNull();
        expect(renderedText.indexOf('Before line items')).toBeLessThan(
            renderedText.indexOf('Item Name'),
        );
        expect(renderedText.indexOf('Item Name')).toBeLessThan(
            renderedText.indexOf('After line items'),
        );
        expect(renderedText.indexOf('After line items')).toBeLessThan(
            renderedText.indexOf('Subtotal₹0.00'),
        );
    });
});
