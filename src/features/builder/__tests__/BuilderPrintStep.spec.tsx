/** @format */

import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { builtInDefaultPrintTemplateHtml } from '../../../db/startup/BuiltInDefaultPrintTemplate';
import { BuilderPrintStep } from '../BuilderPrintStep';
import { defaultSavedPrintTemplates } from '../BuilderSavedTemplatesSupport';

describe('BuilderPrintStep', () => {
    it('shows a reusable template selector and remove action', () => {
        const onSelectTemplate = vi.fn();
        const onRemoveTemplate = vi.fn();

        render(
            <BuilderPrintStep
                activeTemplateName="Shared template"
                assets={[]}
                onImportAssets={vi.fn()}
                onImportHtml={vi.fn()}
                onRemoveAsset={vi.fn()}
                onRemoveTemplate={onRemoveTemplate}
                onSelectTemplate={onSelectTemplate}
                savedTemplates={[
                    ...defaultSavedPrintTemplates(),
                    {
                        name: 'Shared template',
                        templateHtml: builtInDefaultPrintTemplateHtml,
                        updatedAt: new Date().toISOString(),
                    },
                ]}
                templateHtml={builtInDefaultPrintTemplateHtml}
            />,
        );

        fireEvent.change(screen.getByLabelText('Shared print HTML'), {
            target: { value: 'Shared template' },
        });
        expect(onSelectTemplate).toHaveBeenCalledWith('Shared template');
        expect(screen.getByRole('button', { name: /Remove HTML/u })).toBeVisible();
        expect(screen.getByRole('button', { name: /Download HTML/u })).toBeVisible();
        expect(screen.getByText('Add or replace HTML')).toBeVisible();
        expect(screen.getByText('Built-in default')).toBeVisible();
        expect(screen.getByText('Shared template')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Remove HTML/u }));
        expect(onRemoveTemplate).toHaveBeenCalledWith('Shared template');
    });
});
