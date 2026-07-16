/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { BuilderFieldPreviewStep } from '../BuilderFieldPreviewStep';

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
});
