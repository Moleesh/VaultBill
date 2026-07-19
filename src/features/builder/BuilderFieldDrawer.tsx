/** @format */

import type { FC } from 'react';
import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';

import { FormField } from '../../components/FormFields';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { FieldTypeSchema } from '../../db/startup/ConfigSchemas';
import {
    BuilderFieldDrawerActions,
    BuilderFieldFormulaSection,
    BuilderFieldToggles,
} from './BuilderFieldDrawerSupport';
import { formatPlacementLabel, type FieldDisplayPlacement } from './BuilderFieldPlacementSupport';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderFieldDrawerProps = {
    readonly field: FieldConfig;
    readonly formulaSuggestions: readonly string[];
    readonly onCancel: () => void;
    readonly onSave: (field: FieldConfig) => void;
};

const readStringFieldValue = (value: unknown): string => (typeof value === 'string' ? value : '');
const readNumberFieldValue = (value: unknown): number | '' =>
    typeof value === 'number' ? value : '';
const placementOptions: readonly FieldDisplayPlacement[] = [
    'Form',
    'LineItemColumn',
    'LineItemDetail',
    'Summary',
    'Hidden',
];

/** Renders the editable drawer for a single document or line-item field. */
export const BuilderFieldDrawer: FC<BuilderFieldDrawerProps> = ({
    field,
    formulaSuggestions,
    onCancel,
    onSave,
}) => {
    const defaultValues: FieldConfig = field;
    const form = useForm({
        defaultValues,
        onSubmit: ({ value }) => {
            onSave(value);
        },
    });

    useEffect(() => {
        form.reset(field);
    }, [field, form]);

    return (
        <form
            className="form-grid"
            onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
            }}
        >
            <form.Field name="FieldId">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Field ID"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="Label">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Label"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="Type">
                {(fieldApi) => (
                    <SearchableDropdown
                        label="Type"
                        value={readStringFieldValue(fieldApi.state.value)}
                        onChange={(value) => {
                            const parsed = FieldTypeSchema.safeParse(value);
                            if (!parsed.success) return;
                            fieldApi.handleChange(parsed.data);
                        }}
                        options={FieldTypeSchema.options.map((type) => ({
                            value: type,
                            label: type,
                        }))}
                    />
                )}
            </form.Field>
            <form.Field name="DisplayPlacement">
                {(fieldApi) => (
                    <SearchableDropdown
                        label="Placement"
                        note="Controls where this field appears in Records and previews."
                        onChange={(value) => {
                            if (!placementOptions.includes(value as FieldDisplayPlacement)) return;
                            fieldApi.handleChange(value);
                        }}
                        options={placementOptions.map((placement) => ({
                            value: placement,
                            label: formatPlacementLabel(placement),
                        }))}
                        value={
                            placementOptions.includes(
                                readStringFieldValue(fieldApi.state.value) as FieldDisplayPlacement,
                            )
                                ? readStringFieldValue(fieldApi.state.value)
                                : 'Form'
                        }
                    />
                )}
            </form.Field>
            <form.Field name="Placeholder">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Placeholder"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="DefaultValue">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Default value"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="Prefix">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Prefix"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="Suffix">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Suffix"
                        onChange={(event) => {
                            fieldApi.handleChange(event.currentTarget.value);
                        }}
                        value={readStringFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="MaxLength">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Maximum length"
                        min="1"
                        onChange={(event) => {
                            const maxLength = event.currentTarget.valueAsNumber;
                            fieldApi.handleChange(Number.isNaN(maxLength) ? undefined : maxLength);
                        }}
                        type="number"
                        value={readNumberFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Field name="Precision">
                {(fieldApi) => (
                    <FormField.TextField
                        label="Decimal precision"
                        min="0"
                        onChange={(event) => {
                            const precision = event.currentTarget.valueAsNumber;
                            fieldApi.handleChange(Number.isNaN(precision) ? undefined : precision);
                        }}
                        type="number"
                        value={readNumberFieldValue(fieldApi.state.value)}
                    />
                )}
            </form.Field>
            <form.Subscribe
                selector={(state) => ({
                    calculated: Boolean(state.values.Calculated),
                    formula: state.values.Formula ?? '',
                    readOnly: Boolean(state.values.ReadOnly),
                    required: Boolean(state.values.Required),
                    visible: state.values.Visible !== false,
                })}
            >
                {({ calculated, formula, readOnly, required, visible }) => (
                    <>
                        <BuilderFieldToggles
                            isCalculated={calculated}
                            isReadOnly={readOnly}
                            isRequired={required}
                            isVisible={visible}
                            onCalculatedChange={(checked) => {
                                form.setFieldValue('Calculated', checked);
                                form.setFieldValue('ReadOnly', checked || readOnly);
                            }}
                            onReadOnlyChange={(checked) => {
                                form.setFieldValue('ReadOnly', checked);
                            }}
                            onRequiredChange={(checked) => {
                                form.setFieldValue('Required', checked);
                            }}
                            onVisibleChange={(checked) => {
                                form.setFieldValue('Visible', checked);
                            }}
                        />
                        {calculated ? (
                            <BuilderFieldFormulaSection
                                formula={formula}
                                formulaSuggestions={formulaSuggestions}
                                onFormulaChange={(value) => {
                                    form.setFieldValue('Formula', value);
                                }}
                            />
                        ) : null}
                    </>
                )}
            </form.Subscribe>
            <BuilderFieldDrawerActions onCancel={onCancel} />
        </form>
    );
};
