/** @format */

import type { CSSProperties, FC } from 'react';

import { FormField } from '../../components/FormFields';
import type { BuilderLayoutConfig, FieldConfig } from './BuilderPageSupport';

type BuilderLayoutStepProps = {
    readonly fields?: readonly FieldConfig[];
    readonly layout: BuilderLayoutConfig;
    readonly onLayoutChange: (layout: BuilderLayoutConfig) => void;
};

const sampleFields = [
    { label: 'Invoice date', value: '2026-06-04' },
    { label: 'Customer name', value: 'Acme Traders' },
    { label: 'GSTIN', value: '29ABCDE1234F1Z5' },
    { label: 'State', value: 'Karnataka' },
    { label: 'Billing address', value: '12 Market Road, Bengaluru' },
    { label: 'Place of supply', value: 'Karnataka' },
] as const;

const sampleValueFor = (field: FieldConfig, index: number): string => {
    const label = field.Label.toLocaleLowerCase();
    if (label.includes('date')) return '2026-06-04';
    if (label.includes('gst')) return '29ABCDE1234F1Z5';
    if (
        label.includes('total') ||
        label.includes('subtotal') ||
        label.includes('tax') ||
        label.includes('amount') ||
        label.includes('price') ||
        field.Type === 'Number'
    ) {
        return '1,250.00';
    }
    if (label.includes('customer') || label.includes('name')) return 'Acme Traders';
    if (label.includes('state')) return 'Karnataka';
    if (label.includes('address')) return '12 Market Road, Bengaluru';
    return sampleFields[index % sampleFields.length]?.value ?? 'Sample value';
};

const buildLayoutPreviewFields = (
    fields: readonly FieldConfig[] | undefined,
    minimumCount: number,
) => {
    const visibleFields =
        fields
            ?.filter((field) => field.Visible !== false)
            .map((field, index) => ({
                label: field.Label || field.FieldId,
                value: sampleValueFor(field, index),
            })) ?? [];

    const previewFields = [...visibleFields];
    for (const sampleField of sampleFields) {
        if (previewFields.length >= minimumCount) break;
        if (previewFields.some((field) => field.label === sampleField.label)) continue;
        previewFields.push(sampleField);
    }
    return previewFields.slice(0, Math.max(minimumCount, 6));
};

/** Renders the single-flow layout controls for the builder wizard. */
export const BuilderLayoutStep: FC<BuilderLayoutStepProps> = ({
    fields,
    layout,
    onLayoutChange,
}) => {
    const columns = Math.max(1, Math.min(5, layout.Columns));
    const gap = Math.max(0, layout.Gap);
    const cellBasis = `calc((100% - ${String((columns - 1) * gap)}px) / ${String(columns)})`;
    const previewFields = buildLayoutPreviewFields(fields, Math.max(4, columns * 2));

    return (
        <div className="builder-layout-step">
            <div className="form-grid">
                <FormField.TextField
                    label="Columns"
                    max="5"
                    min="1"
                    onChange={(event) => {
                        onLayoutChange({
                            ...layout,
                            Columns: Math.min(
                                5,
                                Math.max(1, Number(event.currentTarget.value) || 1),
                            ),
                        });
                    }}
                    type="number"
                    value={columns}
                />
                <FormField.TextField
                    label="Gap"
                    min="0"
                    onChange={(event) => {
                        onLayoutChange({
                            ...layout,
                            Gap: Number(event.currentTarget.value) || 0,
                        });
                    }}
                    type="number"
                    value={gap}
                />
            </div>
            <article className="builder-layout-preview" data-layout-mode="Flex">
                <div>
                    <strong>Layout preview</strong>
                    <p>Use columns and gap to shape a simple page flow for the form.</p>
                </div>
                <div
                    className="builder-layout-preview-grid builder-layout-preview-grid--flex"
                    style={
                        {
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'stretch',
                            alignContent: 'flex-start',
                            '--builder-layout-columns': String(columns),
                            '--builder-layout-gap': `${String(gap)}px`,
                            gap: `${String(gap)}px`,
                        } as CSSProperties
                    }
                >
                    {previewFields.map((field, cellIndex) => (
                        <span
                            key={`${field.label}-${String(cellIndex)}`}
                            className="layout-preview-flow"
                            style={{
                                flex: `1 1 ${cellBasis}`,
                                minWidth: columns > 1 ? '12rem' : '100%',
                                minHeight: '7rem',
                            }}
                        >
                            <small>{field.label}</small>
                            <strong>{field.value}</strong>
                        </span>
                    ))}
                </div>
            </article>
        </div>
    );
};
