/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { builtInDefaultPrintTemplateHtml } from '../../../db/startup/BuiltInDefaultPrintTemplate';
import { defaultBuilderPrintSettings } from '../BuilderPageSupport';
import { BuilderPrintPreviewStep } from '../BuilderPrintPreviewStep';

describe('BuilderPrintPreviewStep', () => {
    it('shows print settings and a preview print action', () => {
        render(
            <BuilderPrintPreviewStep
                assets={[]}
                config={builtInDefaultFormat}
                onPrintSettingsChange={vi.fn()}
                printSettings={defaultBuilderPrintSettings}
                templateHtml={builtInDefaultPrintTemplateHtml}
                validation={[]}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Print preview' })).toBeVisible();
        expect(screen.getByRole('button', { name: /Test print/u })).toBeVisible();
        expect(screen.getByLabelText('Paper size')).toBeVisible();
        expect(screen.getByLabelText('Orientation')).toBeVisible();
        expect(screen.getByLabelText('Width (cm)')).toHaveValue(21);
        expect(screen.getByLabelText('Height (cm)')).toHaveValue(29.7);
        expect(screen.getByLabelText('Margin preset')).toBeVisible();
        expect(screen.getByTitle('Print template preview')).not.toHaveAttribute('scrolling');
    });

    it('auto-fills dimensions when paper size or orientation changes', () => {
        const onPrintSettingsChange = vi.fn();
        const portalRoot = document.createElement('div');
        portalRoot.id = 'portal-root';
        document.body.append(portalRoot);
        render(
            <BuilderPrintPreviewStep
                assets={[]}
                config={builtInDefaultFormat}
                onPrintSettingsChange={onPrintSettingsChange}
                printSettings={defaultBuilderPrintSettings}
                templateHtml={builtInDefaultPrintTemplateHtml}
                validation={[]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Orientation Portrait' }));
        fireEvent.click(screen.getByRole('option', { name: 'Landscape' }));

        expect(onPrintSettingsChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                Orientation: 'Landscape',
                PageWidthCm: 29.7,
                PageHeightCm: 21,
            }),
        );
        portalRoot.remove();
    });

    it('prints the rendered preview iframe from the print action', () => {
        const focus = vi.fn();
        const print = vi.fn();
        render(
            <BuilderPrintPreviewStep
                assets={[]}
                config={builtInDefaultFormat}
                onPrintSettingsChange={vi.fn()}
                printSettings={defaultBuilderPrintSettings}
                templateHtml={builtInDefaultPrintTemplateHtml}
                validation={[]}
            />,
        );

        Object.defineProperty(screen.getByTitle('Print template preview'), 'contentWindow', {
            configurable: true,
            value: { focus, print },
        });

        fireEvent.click(screen.getByRole('button', { name: /Test print/u }));

        expect(focus).toHaveBeenCalledOnce();
        expect(print).toHaveBeenCalledOnce();
    });
});
