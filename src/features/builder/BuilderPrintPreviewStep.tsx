/** @format */

import type { FC } from 'react';
import { useRef } from 'react';

import { Printer } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { renderBuilderPreview } from './BuilderPagePreviewSupport';
import {
    defaultBuilderPrintSettings,
    type AssetSummary,
    type BuilderPrintConfig,
} from './BuilderPageSupport';

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
            <section
                className="builder-print-settings"
                aria-labelledby="builder-print-settings-title"
            >
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">Print settings</p>
                        <h3 id="builder-print-settings-title">Paper and margin</h3>
                    </div>
                    <ActionButton
                        onClick={() => {
                            onPrintSettingsChange({
                                ...defaultBuilderPrintSettings,
                            });
                        }}
                        variant="secondary"
                    >
                        Restore defaults
                    </ActionButton>
                </div>
                <div className="form-grid">
                    <SearchableDropdown
                        label="Paper size"
                        onChange={(value) => {
                            onPrintSettingsChange({
                                ...printSettings,
                                PaperSize: value as BuilderPrintConfig['PaperSize'],
                            });
                        }}
                        options={[
                            { value: 'A4', label: 'A4' },
                            { value: 'Letter', label: 'Letter' },
                            { value: 'Thermal', label: 'Thermal' },
                        ]}
                        value={printSettings.PaperSize}
                    />
                    <SearchableDropdown
                        label="Margin preset"
                        onChange={(value) => {
                            onPrintSettingsChange({
                                ...printSettings,
                                MarginPreset: value as BuilderPrintConfig['MarginPreset'],
                            });
                        }}
                        options={[
                            { value: 'Normal', label: 'Normal' },
                            { value: 'Compact', label: 'Compact' },
                            { value: 'Wide', label: 'Wide' },
                        ]}
                        value={printSettings.MarginPreset}
                    />
                    <FormField.TextField
                        label="Bottom spacing (mm)"
                        max="60"
                        min="0"
                        onChange={(event) => {
                            onPrintSettingsChange({
                                ...printSettings,
                                BottomSpacingMm: Number(event.currentTarget.value) || 0,
                            });
                        }}
                        type="number"
                        value={printSettings.BottomSpacingMm}
                    />
                </div>
            </section>
            <section
                className="builder-preview-card builder-preview-card--print span-2"
                aria-labelledby="builder-print-preview-title"
            >
                <div className="builder-preview-card-intro">
                    <h3 id="builder-print-preview-title">Print preview</h3>
                    <p>{config.FormatName} template</p>
                </div>
                <div className="builder-print-preview-meta">
                    <span>{printSettings.PaperSize}</span>
                    <span>{printSettings.MarginPreset} margin</span>
                    <span>{printSettings.BottomSpacingMm} mm bottom spacing</span>
                </div>
                <div
                    className="builder-preview-card-frame builder-preview-card-frame--paper"
                    style={{ aspectRatio: paperAspectRatio }}
                >
                    <iframe
                        ref={iframeRef}
                        sandbox="allow-modals"
                        srcDoc={renderBuilderPreview(templateHtml, config, assets, printSettings)}
                        title="Print template preview"
                    />
                </div>
                <IconButton
                    icon={<Printer aria-hidden="true" size={18} />}
                    onClick={() => {
                        const iframe = iframeRef.current;
                        iframe?.contentWindow?.focus();
                        iframe?.contentWindow?.print();
                    }}
                    variant="primary"
                >
                    Print preview
                </IconButton>
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
