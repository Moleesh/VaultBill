/** @format */

import type { FC } from 'react';

import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { DragHandleButton } from '../../components/DragHandleButton';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';
import type { FieldConfig } from './BuilderPageSupport';
import { move } from './BuilderPageSupport';

import {
    usePointerReorder,
    type ReorderPlacement,
} from '../../components/ReorderableRows/usePointerReorder';

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
    const reorder = (from: number, to: number) => {
        if (from === to) return;
        onChange(move(fields, from, to));
    };

    const reorderById = (
        draggedFieldId: string,
        targetFieldId: string,
        placement: ReorderPlacement,
    ) => {
        const fromIndex = fields.findIndex((field) => field.FieldId === draggedFieldId);
        const targetIndex = fields.findIndex((field) => field.FieldId === targetFieldId);
        if (fromIndex < 0 || targetIndex < 0) return;
        const destinationIndex = placement === 'after' ? targetIndex + 1 : targetIndex;
        reorder(fromIndex, fromIndex < destinationIndex ? destinationIndex - 1 : destinationIndex);
    };

    const reorderRows = usePointerReorder({
        onReorder: reorderById,
        rowSelector: '.builder-fields > article[data-reorder-id]',
    });

    return (
        <div className="builder-fields" data-dragging={reorderRows.draggedId ? 'true' : undefined}>
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
                    data-field-id={field.FieldId}
                    {...reorderRows.getRowProps(field.FieldId)}
                    key={field.FieldId}
                >
                    <DragHandleButton
                        aria-label={`Drag ${field.Label}`}
                        icon={<GripVertical aria-hidden="true" size={17} />}
                        {...reorderRows.getHandleProps(field.FieldId)}
                        onClick={(event) => {
                            event.preventDefault();
                            reorderRows.toggleSelectedFromHandle(field.FieldId);
                        }}
                        title={`Reorder ${field.Label}`}
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
                        {reorderRows.selectedId === field.FieldId ? (
                            <span className="builder-field-reorder-hint">
                                Pick where this field should move.
                            </span>
                        ) : null}
                        {reorderRows.selectedId && reorderRows.selectedId !== field.FieldId ? (
                            <span
                                className="builder-field-reorder-targets"
                                onClick={(event) => {
                                    event.stopPropagation();
                                }}
                            >
                                <IconButton
                                    onClick={() => {
                                        reorderRows.completeSelectedReorder(
                                            field.FieldId,
                                            'before',
                                        );
                                    }}
                                    variant="secondary"
                                >
                                    Place before
                                </IconButton>
                                <IconButton
                                    onClick={() => {
                                        reorderRows.completeSelectedReorder(field.FieldId, 'after');
                                    }}
                                    variant="secondary"
                                >
                                    Place after
                                </IconButton>
                            </span>
                        ) : null}
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
