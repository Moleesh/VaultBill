/** @format */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { FieldTypeSchema } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';
import { BuilderFieldFormulaSection } from './BuilderFieldDrawerSupport';

type BuilderFieldDrawerProps = {
    readonly field: FieldConfig;
    readonly formulaSuggestions: readonly string[];
    readonly onCancel: () => void;
    readonly onSave: (field: FieldConfig) => void;
};

/**
 * Renders the editable drawer for a single document or line-item field.
 *
 * The drawer keeps a local draft so typing does not constantly mutate the
 * source config while the user is editing a field.
 */
export const BuilderFieldDrawer: FC<BuilderFieldDrawerProps> = ({
    field,
    formulaSuggestions,
    onCancel,
    onSave,
}) => {
    const [draft, setDraft] = useState(field);

    useEffect(() => {
        setDraft(field);
    }, [field]);

    return (
        <form
            className="form-grid"
            onSubmit={(event) => {
                event.preventDefault();
                onSave(draft);
            }}
        >
            <label>
                <span>Field ID</span>
                <input
                    value={draft.FieldId}
                    onChange={(event) => {
                        setDraft({ ...draft, FieldId: event.currentTarget.value });
                    }}
                />
            </label>
            <label>
                <span>Label</span>
                <input
                    value={draft.Label}
                    onChange={(event) => {
                        setDraft({ ...draft, Label: event.currentTarget.value });
                    }}
                />
            </label>
            <SearchableDropdown
                label="Type"
                value={draft.Type}
                onChange={(value) => {
                    const parsed = FieldTypeSchema.safeParse(value);
                    if (!parsed.success) return;
                    setDraft({ ...draft, Type: parsed.data });
                }}
                options={FieldTypeSchema.options.map((type) => ({ value: type, label: type }))}
            />
            <label>
                <span>Placeholder</span>
                <input
                    value={draft.Placeholder ?? ''}
                    onChange={(event) => {
                        setDraft({ ...draft, Placeholder: event.currentTarget.value });
                    }}
                />
            </label>
            <label>
                <span>Default value</span>
                <input
                    value={typeof draft.DefaultValue === 'string' ? draft.DefaultValue : ''}
                    onChange={(event) => {
                        setDraft({ ...draft, DefaultValue: event.currentTarget.value });
                    }}
                />
            </label>
            <label>
                <span>Prefix</span>
                <input
                    value={draft.Prefix ?? ''}
                    onChange={(event) => {
                        setDraft({ ...draft, Prefix: event.currentTarget.value });
                    }}
                />
            </label>
            <label>
                <span>Suffix</span>
                <input
                    value={draft.Suffix ?? ''}
                    onChange={(event) => {
                        setDraft({ ...draft, Suffix: event.currentTarget.value });
                    }}
                />
            </label>
            <label>
                <span>Maximum length</span>
                <input
                    min="1"
                    type="number"
                    value={draft.MaxLength ?? ''}
                    onChange={(event) => {
                        const maxLength = event.currentTarget.valueAsNumber;
                        setDraft({
                            ...draft,
                            MaxLength: Number.isNaN(maxLength) ? undefined : maxLength,
                        });
                    }}
                />
            </label>
            <label>
                <span>Decimal precision</span>
                <input
                    min="0"
                    type="number"
                    value={draft.Precision ?? ''}
                    onChange={(event) => {
                        const precision = event.currentTarget.valueAsNumber;
                        setDraft({
                            ...draft,
                            Precision: Number.isNaN(precision) ? undefined : precision,
                        });
                    }}
                />
            </label>
            <label className="checkbox-field">
                <input
                    checked={Boolean(draft.Required)}
                    onChange={(event) => {
                        setDraft({ ...draft, Required: event.currentTarget.checked });
                    }}
                    type="checkbox"
                />
                <span>Required</span>
            </label>
            <label className="checkbox-field">
                <input
                    checked={draft.Visible !== false}
                    onChange={(event) => {
                        setDraft({ ...draft, Visible: event.currentTarget.checked });
                    }}
                    type="checkbox"
                />
                <span>Visible</span>
            </label>
            <label className="checkbox-field">
                <input
                    checked={Boolean(draft.ReadOnly)}
                    onChange={(event) => {
                        setDraft({ ...draft, ReadOnly: event.currentTarget.checked });
                    }}
                    type="checkbox"
                />
                <span>Read only</span>
            </label>
            <label className="checkbox-field">
                <input
                    checked={Boolean(draft.Calculated)}
                    onChange={(event) => {
                        setDraft({
                            ...draft,
                            Calculated: event.currentTarget.checked,
                            ReadOnly: event.currentTarget.checked || draft.ReadOnly,
                        });
                    }}
                    type="checkbox"
                />
                <span>Calculated</span>
            </label>
            {draft.Calculated ? (
                <BuilderFieldFormulaSection
                    fieldId={draft.FieldId}
                    formula={draft.Formula ?? ''}
                    formulaSuggestions={formulaSuggestions}
                    onFormulaChange={(value) => {
                        setDraft({ ...draft, Formula: value });
                    }}
                />
            ) : null}
            <div className="popup-actions span-2">
                <button className="button-secondary" onClick={onCancel} type="button">
                    Cancel
                </button>
                <button className="button-primary" type="submit">
                    Save field
                </button>
            </div>
        </form>
    );
};
