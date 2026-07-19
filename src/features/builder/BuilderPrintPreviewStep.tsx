/** @format */

import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary, BuilderPrintConfig } from './BuilderPageSupport';
import { BuilderPrintPreviewFrame } from './BuilderPrintPreviewFrame';
import { BuilderPrintPreviewSettings } from './BuilderPrintPreviewSettings';

type BuilderPrintPreviewStepProps = {
    readonly config: DocumentFormatConfig;
    readonly assets: readonly AssetSummary[];
    readonly templateHtml: string;
    readonly validation: readonly string[];
    readonly printSettings: BuilderPrintConfig;
    readonly onPrintSettingsChange: (printSettings: BuilderPrintConfig) => void;
};

/** Shows the final rendered HTML output before the builder publishes the format. */
export const BuilderPrintPreviewStep: FC<BuilderPrintPreviewStepProps> = ({
    config,
    assets,
    templateHtml,
    validation,
    printSettings,
    onPrintSettingsChange,
}) => {
    return (
        <>
            <BuilderPrintPreviewSettings
                onPrintSettingsChange={onPrintSettingsChange}
                printSettings={printSettings}
            />
            <section
                className="builder-preview-card builder-preview-card--print"
                aria-labelledby="builder-print-preview-title"
            >
                <div className="builder-preview-card-intro">
                    <h3 id="builder-print-preview-title">Print preview</h3>
                    <p>{config.FormatName} template</p>
                </div>
                <div className="builder-print-preview-meta">
                    <span>{printSettings.PaperSize}</span>
                    <span>{printSettings.Orientation.toLocaleLowerCase()}</span>
                    <span>{`${String(printSettings.PageWidthCm)} x ${String(
                        printSettings.PageHeightCm,
                    )} cm`}</span>
                    <span>{printSettings.MarginPreset} margin</span>
                    <span>{printSettings.BottomSpacingMm} mm bottom spacing</span>
                </div>
                <BuilderPrintPreviewFrame
                    assets={assets}
                    config={config}
                    printSettings={printSettings}
                    templateHtml={templateHtml}
                />
            </section>
            {validation.length > 0 ? (
                <div className="feedback-info span-2">
                    <strong>Check before publishing</strong>
                    <ul>
                        {validation.map((error) => (
                            <li key={error}>{error}</li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </>
    );
};
