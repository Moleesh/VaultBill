/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { BuilderFieldPreviewStep } from '../BuilderFieldPreviewStep';
import type { FieldConfig } from '../BuilderPageSupport';

describe('BuilderFieldPreviewStep', () => {
    it.each([
        { columns: 3, gap: 28 },
        { columns: 5, gap: 16 },
    ])('uses $columns columns and $gap px gap in the field preview grid', ({ columns, gap }) => {
        render(
            <BuilderFieldPreviewStep
                config={builtInDefaultFormat}
                fields={builtInDefaultFormat.Fields}
                layout={{ Columns: columns, Gap: gap }}
                lineSection={undefined}
            />,
        );

        const grid = screen.getByLabelText('Document field preview');
        const layoutGrid = grid.querySelector('.builder-preview-grid--read-only');

        expect(layoutGrid).not.toBeNull();
        expect(layoutGrid).toHaveStyle({ gap: `${String(gap)}px` });
        expect(layoutGrid).toHaveStyle({ '--builder-layout-columns': String(columns) });
        expect(layoutGrid).toHaveStyle({ '--builder-layout-gap': `${String(gap)}px` });
        expect(screen.getByRole('heading', { name: 'Field preview' })).toBeVisible();
        expect(screen.queryByText('Document fields')).toBeNull();
        expect(
            screen.getByText(
                `Flex columns ${String(columns)} with ${String(
                    gap,
                )}px gap. This view is read-only and mirrors the entry form order.`,
            ),
        ).toBeVisible();
    });

    it('renders document fields around the line-item marker in builder order', () => {
        const fields = [
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
        ] satisfies readonly FieldConfig[];
        const { container } = render(
            <BuilderFieldPreviewStep
                config={{ ...builtInDefaultFormat, FormatName: 'Flow test' }}
                fields={fields}
                layout={{ Columns: 2, Gap: 16 }}
                lineSection={{
                    Enabled: true,
                    Fields: [
                        {
                            FieldId: 'ItemName',
                            Label: 'Item name',
                            Type: 'Text',
                            Visible: true,
                        },
                    ],
                    Label: 'Items',
                }}
            />,
        );

        const renderedText = container.textContent;

        expect(screen.getByLabelText('Before line items')).toBeVisible();
        expect(screen.getByLabelText('After line items')).toBeVisible();
        expect(screen.queryByText('Line marker')).toBeNull();
        expect(screen.queryByText('Hidden after line items')).toBeNull();
        expect(renderedText.indexOf('Before line items')).toBeLessThan(
            renderedText.indexOf('Items'),
        );
        expect(renderedText.indexOf('Items')).toBeLessThan(
            renderedText.indexOf('After line items'),
        );
    });
});
