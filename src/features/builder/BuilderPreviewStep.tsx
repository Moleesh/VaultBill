/** @format */

import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { AssetSummary, FieldConfig } from './BuilderPageSupport';
import { previewValue, renderBuilderPreview } from './BuilderPagePreviewSupport';

type LineSection = {
    readonly Fields: readonly FieldConfig[];
};

type BuilderPreviewStepProps = {
    readonly config: DocumentFormatConfig;
    readonly fields: readonly FieldConfig[];
    readonly lineSection: LineSection | undefined;
    readonly assets: readonly AssetSummary[];
    readonly templateHtml: string;
    readonly validation: readonly string[];
};

/** Renders the final field and print previews before publishing. */
export const BuilderPreviewStep: FC<BuilderPreviewStepProps> = ({
    config,
    fields,
    lineSection,
    assets,
    templateHtml,
    validation,
}) => (
    <div className="builder-final-preview">
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
                <div className="builder-preview-grid">
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
                                gridTemplateColumns: `repeat(${String(lineSection.Fields.length || 1)}, minmax(8rem, 1fr))`,
                            }}
                        >
                            {lineSection.Fields.map((field) => (
                                <span key={field.FieldId}>{field.Label}</span>
                            ))}
                        </div>
                        <div
                            className="builder-preview-table__row builder-preview-table__row--body"
                            style={{
                                gridTemplateColumns: `repeat(${String(lineSection.Fields.length || 1)}, minmax(8rem, 1fr))`,
                            }}
                        >
                            {lineSection.Fields.map((field) => (
                                <span key={field.FieldId}>
                                    {previewValue(
                                        field.SampleValue ?? field.DefaultValue ?? 'Sample',
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
        <section className="builder-preview-card" aria-labelledby="builder-print-preview-title">
            <h3 id="builder-print-preview-title">Print preview</h3>
            <p>{config.FormatName} template</p>
            <iframe
                sandbox=""
                srcDoc={renderBuilderPreview(templateHtml, config, assets)}
                title="Print template preview"
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
    </div>
);
