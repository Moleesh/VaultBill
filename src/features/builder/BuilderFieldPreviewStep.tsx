/** @format */

import type { CSSProperties, FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { splitFieldsAroundLineItems } from './BuilderFieldFlowSupport';
import { previewValue } from './BuilderPagePreviewSupport';
import type { BuilderLayoutConfig, FieldConfig } from './BuilderPageSupport';

type LineSection = {
    readonly Label: string;
    readonly Enabled?: boolean | undefined;
    readonly Fields: readonly FieldConfig[];
};

type BuilderFieldPreviewStepProps = {
    readonly config: DocumentFormatConfig;
    readonly layout: BuilderLayoutConfig;
    readonly fields: readonly FieldConfig[];
    readonly lineSection: LineSection | undefined;
};

/** Shows the entry-form preview before the print template step. */
export const BuilderFieldPreviewStep: FC<BuilderFieldPreviewStepProps> = ({
    config,
    layout,
    fields,
    lineSection,
}) => {
    const columns = Math.max(1, Math.min(5, layout.Columns));
    const lineItemFields = lineSection?.Fields ?? [];
    const { afterLineItems, beforeLineItems } = splitFieldsAroundLineItems(fields);
    const renderFields = (previewFields: readonly FieldConfig[]) =>
        previewFields.map((field) => (
            <article key={field.FieldId} aria-label={field.Label} className="builder-preview-field">
                <span>{field.Label}</span>
                <strong>
                    {previewValue(field.SampleValue ?? field.DefaultValue ?? field.Label)}
                </strong>
            </article>
        ));

    return (
        <section className="builder-preview-card" aria-labelledby="builder-field-preview-title">
            <h3 id="builder-field-preview-title">Field preview</h3>
            <p>{config.FormatName} entry form</p>
            <p className="builder-preview-layout-note">
                Flex columns {String(columns)} with {String(Math.max(0, layout.Gap))}px gap. This
                view is read-only and mirrors the entry form order.
            </p>
            <div className="builder-preview-surface" aria-label="Document field preview">
                <div
                    className="builder-preview-grid builder-preview-grid--read-only"
                    style={
                        {
                            gap: `${String(Math.max(0, layout.Gap))}px`,
                            '--builder-layout-columns': String(columns),
                            '--builder-layout-gap': `${String(Math.max(0, layout.Gap))}px`,
                        } as CSSProperties
                    }
                >
                    {renderFields(beforeLineItems)}
                </div>
                {lineSection && lineSection.Enabled !== false ? (
                    <>
                        <HorizontalProgress
                            className="builder-preview-table-scroll builder-preview-table-scroll--desktop"
                            label="Line item preview"
                            showControls={false}
                        >
                            <div
                                className="builder-preview-table builder-preview-table--desktop"
                                aria-label="Line item preview"
                            >
                                <div className="builder-preview-table-heading">
                                    <div>
                                        <strong>{lineSection.Label}</strong>
                                        <small>
                                            Two sample rows stay visible for row-level review.
                                        </small>
                                    </div>
                                </div>
                                <div
                                    className="builder-preview-table-row builder-preview-table-row--header"
                                    style={{
                                        gridTemplateColumns: `repeat(${String(
                                            lineItemFields.length || 1,
                                        )}, minmax(8rem, 1fr))`,
                                    }}
                                >
                                    {lineItemFields.map((field) => (
                                        <span key={field.FieldId}>{field.Label}</span>
                                    ))}
                                </div>
                                {['Sample row 1', 'Sample row 2'].map((rowLabel, rowIndex) => (
                                    <div
                                        className="builder-preview-table-row builder-preview-table-row--body"
                                        key={rowLabel}
                                        style={{
                                            gridTemplateColumns: `repeat(${String(
                                                lineItemFields.length || 1,
                                            )}, minmax(8rem, 1fr))`,
                                        }}
                                    >
                                        {lineItemFields.map((field) => (
                                            <span key={`${field.FieldId}-${String(rowIndex)}`}>
                                                {previewValue(
                                                    rowIndex === 0
                                                        ? (field.SampleValue ??
                                                              field.DefaultValue ??
                                                              field.Label)
                                                        : field.Type === 'Text' ||
                                                            field.Type === 'Textarea'
                                                          ? `${previewValue(
                                                                field.SampleValue ??
                                                                    field.DefaultValue ??
                                                                    field.Label,
                                                            )} 2`
                                                          : (field.SampleValue ??
                                                            field.DefaultValue ??
                                                            'Sample'),
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </HorizontalProgress>
                        <div
                            className="builder-preview-table builder-preview-table--mobile"
                            aria-label="Line item preview"
                        >
                            <div className="builder-preview-table-heading">
                                <div>
                                    <strong>{lineSection.Label}</strong>
                                    <small>
                                        Two sample rows stay visible for row-level review.
                                    </small>
                                </div>
                            </div>
                            {['Sample row 1', 'Sample row 2'].map((rowLabel, rowIndex) => (
                                <article
                                    className="builder-preview-table-mobile-row"
                                    key={rowLabel}
                                >
                                    <strong>{rowLabel}</strong>
                                    <div className="builder-preview-table-mobile-grid">
                                        {lineItemFields.map((field) => (
                                            <div
                                                className="builder-preview-table-mobile-cell"
                                                key={`${field.FieldId}-${String(rowIndex)}-mobile`}
                                            >
                                                <span>{field.Label}</span>
                                                <strong>
                                                    {previewValue(
                                                        rowIndex === 0
                                                            ? (field.SampleValue ??
                                                                  field.DefaultValue ??
                                                                  field.Label)
                                                            : field.Type === 'Text' ||
                                                                field.Type === 'Textarea'
                                                              ? `${previewValue(
                                                                    field.SampleValue ??
                                                                        field.DefaultValue ??
                                                                        field.Label,
                                                                )} 2`
                                                              : (field.SampleValue ??
                                                                field.DefaultValue ??
                                                                'Sample'),
                                                    )}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                ) : null}
                {afterLineItems.length > 0 ? (
                    <div
                        className="builder-preview-grid builder-preview-grid--read-only"
                        style={
                            {
                                gap: `${String(Math.max(0, layout.Gap))}px`,
                                '--builder-layout-columns': String(columns),
                                '--builder-layout-gap': `${String(Math.max(0, layout.Gap))}px`,
                            } as CSSProperties
                        }
                    >
                        {renderFields(afterLineItems)}
                    </div>
                ) : null}
                <p className="builder-preview-layout-note builder-preview-layout-note--bottom">
                    Layout preview follows the builder field order around the line-item section.
                </p>
            </div>
        </section>
    );
};
