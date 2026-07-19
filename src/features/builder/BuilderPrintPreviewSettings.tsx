/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import {
    defaultBuilderPrintSettings,
    dimensionsForPaper,
    type BuilderPrintConfig,
} from './BuilderPageSupport';

type BuilderPrintPreviewSettingsProps = {
    readonly printSettings: BuilderPrintConfig;
    readonly onPrintSettingsChange: (printSettings: BuilderPrintConfig) => void;
};

/** Controls paper, margin, and size metadata for the preview renderer. */
export const BuilderPrintPreviewSettings: FC<BuilderPrintPreviewSettingsProps> = ({
    printSettings,
    onPrintSettingsChange,
}) => (
    <section className="builder-print-settings" aria-labelledby="builder-print-settings-title">
        <div className="section-heading">
            <div>
                <p className="eyebrow">Print settings</p>
                <h3 id="builder-print-settings-title">Paper and margin</h3>
            </div>
            <ActionButton
                onClick={() => {
                    onPrintSettingsChange({ ...defaultBuilderPrintSettings });
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
                    const paperSize = value as BuilderPrintConfig['PaperSize'];
                    onPrintSettingsChange({
                        ...printSettings,
                        PaperSize: paperSize,
                        ...dimensionsForPaper(paperSize, printSettings.Orientation),
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
                label="Orientation"
                onChange={(value) => {
                    const orientation = value as BuilderPrintConfig['Orientation'];
                    onPrintSettingsChange({
                        ...printSettings,
                        Orientation: orientation,
                        ...dimensionsForPaper(printSettings.PaperSize, orientation),
                    });
                }}
                options={[
                    { value: 'Portrait', label: 'Portrait' },
                    { value: 'Landscape', label: 'Landscape' },
                ]}
                value={printSettings.Orientation}
            />
            <FormField.TextField
                label="Width (cm)"
                max="120"
                min="1"
                onChange={(event) => {
                    onPrintSettingsChange({
                        ...printSettings,
                        PageWidthCm: Number(event.currentTarget.value) || 1,
                    });
                }}
                step="0.1"
                type="number"
                value={printSettings.PageWidthCm}
            />
            <FormField.TextField
                label="Height (cm)"
                max="120"
                min="1"
                onChange={(event) => {
                    onPrintSettingsChange({
                        ...printSettings,
                        PageHeightCm: Number(event.currentTarget.value) || 1,
                    });
                }}
                step="0.1"
                type="number"
                value={printSettings.PageHeightCm}
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
);
