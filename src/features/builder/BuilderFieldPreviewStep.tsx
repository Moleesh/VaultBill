/** @format */

import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary, BuilderLayoutConfig, FieldConfig } from './BuilderPageSupport';
import { previewValue } from './BuilderPagePreviewSupport';

type LineSection = {
    readonly Fields: readonly FieldConfig[];
};

type BuilderFieldPreviewStepProps = {
    readonly config: DocumentFormatConfig;
    readonly layout: BuilderLayoutConfig;
    readonly fields: readonly FieldConfig[];
    readonly lineSection: LineSection | undefined;
    readonly assets: readonly AssetSummary[];
};

/** Shows the interactive document-entry preview before the print template step. */
export const BuilderFieldPreviewStep: FC<BuilderFieldPreviewStepProps> = ({
    config,
    layout,
    fields,
    lineSection,
    assets,
}) => (
    <section className="builder-preview-card" aria-labelledby="builder-field-preview-title">
        <h3 id="builder-field-preview-title">Field preview</h3>
        <p>{config.FormatName} entry form</p>
        <dl className="builder-preview-summary">
            <div>
                <dt>Document fields</dt>
                <dd>{fields.length}</dd>
            </div>
            <div>
                <dt>Line-item fields</dt>
                <dd>{lineSection?.Fields.length ?? 0}</dd>
            </div>
            <div>
                <dt>Assets</dt>
                <dd>{assets.length}</dd>
            </div>
            <div>
                <dt>Currency</dt>
                <dd>{config.CalculationPolicy.Currency}</dd>
            </div>
        </dl>
        <div className="builder-preview-surface" aria-label="Document field preview">
            <div
                className="builder-preview-grid"
                style={{
                    gap: `${String(Math.max(0, layout.Gap))}px`,
                    gridTemplateColumns: `repeat(${String(Math.max(1, layout.Columns))}, minmax(0, 1fr))`,
                }}
            >
                {fields.map((field) => (
                    <label key={field.FieldId}>
                        <span>{field.Label}</span>
                        <input
                            readOnly
                            value={previewValue(
                                field.SampleValue ?? field.DefaultValue ?? field.Label,
                            )}
                        />
                    </label>
                ))}
            </div>
            {lineSection ? (
                <div className="builder-preview-table" aria-label="Line item preview">
                    <div
                        className="builder-preview-table__row builder-preview-table__row--header"
                        style={{
                            gridTemplateColumns: `repeat(${String(
                                lineSection.Fields.length || 1,
                            )}, minmax(8rem, 1fr))`,
                        }}
                    >
                        {lineSection.Fields.map((field) => (
                            <span key={field.FieldId}>{field.Label}</span>
                        ))}
                    </div>
                    <div
                        className="builder-preview-table__row builder-preview-table__row--body"
                        style={{
                            gridTemplateColumns: `repeat(${String(
                                lineSection.Fields.length || 1,
                            )}, minmax(8rem, 1fr))`,
                        }}
                    >
                        {lineSection.Fields.map((field) => (
                            <span key={field.FieldId}>
                                {previewValue(field.SampleValue ?? field.DefaultValue ?? 'Sample')}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    </section>
);
