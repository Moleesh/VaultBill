/** @format */

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import type { FC } from 'react';

import type { FieldConfig } from './BuilderPageSupport';
import { move } from './BuilderPageSupport';

type BuilderFieldEditorProps = {
    readonly fields: readonly FieldConfig[];
    readonly referencedFieldIds: ReadonlySet<string>;
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
};

/** Renders the reorderable field list for document and line-item fields. */
export const BuilderFieldEditor: FC<BuilderFieldEditorProps> = ({
    fields,
    referencedFieldIds,
    onAdd,
    onChange,
    onEdit,
}) => (
    <div className="builder-fields">
        <div className="section-heading">
            <div>
                <h3>Configured fields</h3>
                <p>Order matches the entry form.</p>
            </div>
            <button className="button-primary" onClick={onAdd} type="button">
                <Plus aria-hidden="true" size={18} /> Add field
            </button>
        </div>
        {fields.map((field, index) => (
            <article key={`${field.FieldId}-${String(index)}`}>
                <button
                    className="builder-fields__main"
                    onClick={() => {
                        onEdit(index);
                    }}
                    type="button"
                >
                    <strong>{`Edit ${field.Label}`}</strong>
                    <span>{field.Type}</span>
                    {field.Calculated ? <small>Calculated</small> : null}
                </button>
                <button
                    aria-label={`Move ${field.Label} up`}
                    disabled={index === 0}
                    onClick={() => {
                        onChange(move(fields, index, index - 1));
                    }}
                    type="button"
                >
                    <ArrowUp aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Move ${field.Label} down`}
                    disabled={index === fields.length - 1}
                    onClick={() => {
                        onChange(move(fields, index, index + 1));
                    }}
                    type="button"
                >
                    <ArrowDown aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Duplicate ${field.Label}`}
                    onClick={() => {
                        onChange([
                            ...fields.slice(0, index + 1),
                            {
                                ...field,
                                FieldId: `${field.FieldId}Copy`,
                                Label: `${field.Label} Copy`,
                            },
                            ...fields.slice(index + 1),
                        ]);
                    }}
                    type="button"
                >
                    <Copy aria-hidden="true" size={17} />
                </button>
                <button
                    aria-label={`Delete ${field.Label}`}
                    disabled={referencedFieldIds.has(field.FieldId)}
                    onClick={() => {
                        onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
                    }}
                    title={
                        referencedFieldIds.has(field.FieldId)
                            ? 'Remove formula references before deleting this field.'
                            : undefined
                    }
                    type="button"
                >
                    <Trash2 aria-hidden="true" size={17} />
                </button>
            </article>
        ))}
    </div>
);
