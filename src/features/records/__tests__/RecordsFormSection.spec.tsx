/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RecordsFormSection } from '../RecordsFormSection';
import { createEmptyRecord } from '../RecordsPageSupport';

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
});
