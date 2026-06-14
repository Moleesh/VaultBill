/** @format */

import { Printer } from 'lucide-react';
import { useRef } from 'react';
import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import {
    defaultBuilderPrintSettings,
    type AssetSummary,
    type BuilderPrintConfig,
} from './BuilderPageSupport';
import { renderBuilderPreview } from './BuilderPagePreviewSupport';

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
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const paperAspectRatio =
        printSettings.PaperSize === 'A4'
            ? '210 / 297'
            : printSettings.PaperSize === 'Letter'
              ? '216 / 279'
              : '80 / 260';

    return (
        <>
            <section className="builder-print-settings" aria-labelledby="builder-print-settings-title">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Print settings</p>
                        <h3 id="builder-print-settings-title">Paper and margin</h3>
                    </div>
                    <button
                        className="button-secondary"
                        onClick={() => {
                            onPrintSettingsChange({
                                ...defaultBuilderPrintSettings,
                            });
                        }}
                        type="button"
                    >
                        Restore defaults
                    </button>
                </div>
                <div className="form-grid">
                    <label>
                        <span>Paper size</span>
                        <select
                            value={printSettings.PaperSize}
                            onChange={(event) => {
                                onPrintSettingsChange({
                                    ...printSettings,
                                    PaperSize:
                                        event.currentTarget.value as BuilderPrintConfig['PaperSize'],
                                });
                            }}
                        >
                            <option value="A4">A4</option>
                            <option value="Letter">Letter</option>
                            <option value="Thermal">Thermal</option>
                        </select>
                    </label>
                    <label>
                        <span>Margin preset</span>
                        <select
                            value={printSettings.MarginPreset}
                            onChange={(event) => {
                                onPrintSettingsChange({
                                    ...printSettings,
                                    MarginPreset:
                                        event.currentTarget.value as BuilderPrintConfig['MarginPreset'],
                                });
                            }}
                        >
                            <option value="Normal">Normal</option>
                            <option value="Compact">Compact</option>
                            <option value="Wide">Wide</option>
                        </select>
                    </label>
                    <label>
                        <span>Bottom spacing (mm)</span>
                        <input
                            min="0"
                            max="60"
                            type="number"
                            value={printSettings.BottomSpacingMm}
                            onChange={(event) => {
                                onPrintSettingsChange({
                                    ...printSettings,
                                    BottomSpacingMm: Number(event.currentTarget.value) || 0,
                                });
                            }}
                        />
                    </label>
                </div>
            </section>
            <section
                className="builder-preview-card builder-preview-card--print span-2"
                aria-labelledby="builder-print-preview-title"
            >
                <div className="builder-preview-card__intro">
                    <h3 id="builder-print-preview-title">Print preview</h3>
                    <p>{config.FormatName} template</p>
                </div>
                <div className="builder-print-preview__meta">
                    <span>{printSettings.PaperSize}</span>
                    <span>{printSettings.MarginPreset} margin</span>
                    <span>{printSettings.BottomSpacingMm} mm bottom spacing</span>
                </div>
                <div
                    className="builder-preview-card__frame builder-preview-card__frame--paper"
                    style={{ aspectRatio: paperAspectRatio }}
                >
                    <iframe
                        ref={iframeRef}
                        sandbox="allow-modals"
                        srcDoc={renderBuilderPreview(templateHtml, config, assets, printSettings)}
                        title="Print template preview"
                    />
                </div>
                <button
                    className="button-primary"
                    onClick={() => {
                        const iframe = iframeRef.current;
                        iframe?.contentWindow?.focus();
                        iframe?.contentWindow?.print();
                    }}
                    type="button"
                >
                    <Printer aria-hidden="true" size={18} /> Print preview
                </button>
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
