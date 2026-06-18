/** @format */

import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { builtInDefaultPrintTemplateHtml } from '../../../db/startup/BuiltInDefaultPrintTemplate';
import { BuilderPrintStep } from '../BuilderPrintStep';
import { defaultSavedPrintTemplates } from '../BuilderSavedTemplatesSupport';

describe('BuilderPrintStep', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
    });

    it('shows a reusable template selector and remove action', async () => {
        const onSelectTemplate = vi.fn();
        const onRemoveTemplate = vi.fn();
        const Wrapper = () => {
            const [activeTemplateName, setActiveTemplateName] = useState('Built-in default');
            return (
                <BuilderPrintStep
                    activeTemplateName={activeTemplateName}
                    assets={[]}
                    onImportAssets={vi.fn()}
                    onImportHtml={vi.fn()}
                    onRemoveAsset={vi.fn()}
                    onRemoveTemplate={onRemoveTemplate}
                    onSelectTemplate={(templateName) => {
                        setActiveTemplateName(templateName);
                        onSelectTemplate(templateName);
                    }}
                    savedTemplates={[
                        ...defaultSavedPrintTemplates(),
                        {
                            name: 'Shared template',
                            templateHtml: builtInDefaultPrintTemplateHtml,
                            updatedAt: new Date().toISOString(),
                        },
                    ]}
                    templateHtml={builtInDefaultPrintTemplateHtml}
                />
            );
        };

        render(<Wrapper />);

        fireEvent.click(
            screen.getByRole('button', { name: /Shared print HTML Built-in default/u }),
        );
        fireEvent.click(await screen.findByRole('option', { name: /Shared template/u }));
        expect(onSelectTemplate).toHaveBeenCalledWith('Shared template');
        expect(screen.getByRole('button', { name: /Remove HTML/u })).toBeVisible();
        expect(screen.getByRole('button', { name: /Download HTML/u })).toBeVisible();
        expect(screen.getByText('Add or replace HTML')).toBeVisible();
        expect(screen.getByText(/Built-in default stays available/u)).toBeVisible();
        expect(screen.getByText('Shared template')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Remove HTML/u }));
        expect(onRemoveTemplate).toHaveBeenCalledWith('Shared template');
    });
});
