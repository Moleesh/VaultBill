/** @format */

import type { CSSProperties, FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { splitFieldsAroundLineItems } from './BuilderFieldFlowSupport';
import {
    groupDocumentFieldsByPlacement,
    groupLineFieldsByPlacement,
} from './BuilderFieldPlacementSupport';
import { BuilderLineItemPreview } from './BuilderLineItemPreview';
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
    const { formFields, summaryFields } = groupDocumentFieldsByPlacement(fields);
    const { lineItemColumns, lineItemDetails } = groupLineFieldsByPlacement(
        lineSection?.Fields ?? [],
    );
    const { afterLineItems, beforeLineItems } = splitFieldsAroundLineItems(formFields);
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
                    <BuilderLineItemPreview
                        label={lineSection.Label}
                        lineItemColumns={lineItemColumns}
                        lineItemDetails={lineItemDetails}
                    />
                ) : null}
                {summaryFields.length > 0 ? (
                    <dl className="builder-preview-summary">
                        {summaryFields.map((field) => (
                            <div key={field.FieldId}>
                                <dt>{field.Label}</dt>
                                <dd>
                                    {previewValue(
                                        field.SampleValue ?? field.DefaultValue ?? '0.00',
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
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
