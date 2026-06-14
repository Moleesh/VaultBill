/** @format */

import { render, screen } from '@testing-library/react';
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
        expect(screen.getByRole('button', { name: /Print preview/u })).toBeVisible();
        expect(screen.getByLabelText('Paper size')).toBeVisible();
        expect(screen.getByLabelText('Margin preset')).toBeVisible();
    });
});
