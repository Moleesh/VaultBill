/** @format */

import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { DragEvent, FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { DragHandleButton } from '../../components/DragHandleButton';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';
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
                <IconButton
                    icon={<Plus aria-hidden="true" size={18} />}
                    onClick={onAdd}
                    variant="primary"
                >
                    Add field
                </IconButton>
            </div>
            {fields.map((field, index) => (
                <article
                    draggable
                    data-field-id={field.FieldId}
                    key={field.FieldId}
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
                    <DragHandleButton
                        aria-label={`Drag ${field.Label}`}
                        icon={<GripVertical aria-hidden="true" size={17} />}
                        onClick={(event) => {
                            event.preventDefault();
                        }}
                        tabIndex={-1}
                    />
                    <ActionButton
                        aria-label={`Edit ${field.Label}`}
                        className="builder-fields-main"
                        onClick={() => {
                            onEdit(index);
                        }}
                    >
                        <span className="builder-fields-main-title">{`Edit ${field.Label}`}</span>
                        <span className="builder-fields-main-type">{field.Type}</span>
                        <span className="builder-fields-main-meta">
                            {field.Calculated ? <small>Calculated</small> : null}
                            {referencedFieldIds.has(field.FieldId) ? (
                                <small className="builder-field-warning">Used in a formula</small>
                            ) : null}
                        </span>
                    </ActionButton>
                    <div className="builder-fields-actions">
                        <IconOnlyButton
                            aria-label={`Duplicate ${field.Label}`}
                            className="builder-fields-action"
                            icon={<Copy aria-hidden="true" size={17} />}
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
                        />
                        <IconOnlyButton
                            aria-label={`Delete ${field.Label}`}
                            className="builder-fields-action"
                            icon={<Trash2 aria-hidden="true" size={17} />}
                            onClick={() => {
                                onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
                            }}
                            title={
                                referencedFieldIds.has(field.FieldId)
                                    ? 'This field is referenced in a formula, but it can still be deleted.'
                                    : undefined
                            }
                        />
                    </div>
                </article>
            ))}
        </div>
    );
};
