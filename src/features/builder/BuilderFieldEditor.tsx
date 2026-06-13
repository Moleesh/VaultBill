/** @format */

import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, FC } from 'react';

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
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | undefined>();

    const reorder = (from: number, to: number) => {
        if (from === to) return;
        onChange(move(fields, from, to));
    };

    const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
        event.preventDefault();
        const from = draggedIndex;
        setDraggedIndex(undefined);
        if (from === undefined) return;
        reorder(from, index);
    };

    return (
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
                <article
                    draggable
                    key={`${field.FieldId}-${String(index)}`}
                    onDragEnd={() => {
                        setDraggedIndex(undefined);
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                    }}
                    onDragStart={(event) => {
                        setDraggedIndex(index);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', field.FieldId);
                    }}
                    onDrop={(event) => {
                        handleDrop(event, index);
                    }}
                >
                    <button
                        aria-label={`Drag ${field.Label}`}
                        className="builder-field-handle"
                        onClick={(event) => {
                            event.preventDefault();
                        }}
                        tabIndex={-1}
                        type="button"
                    >
                        <GripVertical aria-hidden="true" size={17} />
                    </button>
                    <button
                        className="builder-fields__main"
                        aria-label={`Edit ${field.Label}`}
                        onClick={() => {
                            onEdit(index);
                        }}
                        type="button"
                    >
                        <strong>{`Edit ${field.Label}`}</strong>
                        <span>{field.Type}</span>
                        {field.Calculated ? <small>Calculated</small> : null}
                        {referencedFieldIds.has(field.FieldId) ? (
                            <small className="builder-field-warning">Used in a formula</small>
                        ) : null}
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
                        onClick={() => {
                            onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
                        }}
                        title={
                            referencedFieldIds.has(field.FieldId)
                                ? 'This field is referenced in a formula, but it can still be deleted.'
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
};
