/** @format */
/* eslint-disable max-lines */

import type { DragEvent, FC } from 'react';
import { useMemo, useState } from 'react';

import {
    Eye,
    FilePlus2,
    GripVertical,
    MoreHorizontal,
    PencilLine,
    Printer,
    RefreshCw,
    Star,
    Trash2,
} from 'lucide-react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { DragHandleButton } from '../../components/DragHandleButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';
import type { BuilderInventoryItem } from './BuilderDocumentLibrarySupport';
import { describeInventoryItem } from './BuilderDocumentLibrarySupport';

type BuilderDocumentLibraryProps = {
    readonly currentFormatId: string;
    readonly currentFormatName: string;
    readonly inventory: readonly BuilderInventoryItem[];
    readonly onCreateNew: () => void;
    readonly onDeleteDocument: (item: BuilderInventoryItem) => Promise<void> | void;
    readonly onDuplicateDocument: (formatId: string) => Promise<void> | void;
    readonly onEditDocument: (formatId: string) => Promise<void> | void;
    readonly onOpenFormatPreview: (formatId: string) => Promise<void> | void;
    readonly onOpenPrintPreview: (formatId: string) => Promise<void> | void;
    readonly onReorderDocuments: (
        draggedFormatId: string,
        targetFormatId: string,
        placement?: 'before' | 'after',
    ) => Promise<void> | void;
    readonly onSetDefaultDocument: (item: BuilderInventoryItem) => Promise<void> | void;
    readonly onSetDocumentEnabled: (
        item: BuilderInventoryItem,
        isEnabled: boolean,
    ) => Promise<void> | void;
    readonly onTestPrintDocument: (formatId: string) => Promise<void> | void;
};

type PendingConfirmation =
    | {
          readonly kind: 'delete' | 'disable';
          readonly item: BuilderInventoryItem;
      }
    | undefined;

type DropTarget = {
    readonly formatId: string;
    readonly placement: 'before' | 'after';
};

/** Shows the Builder document inventory with management actions per saved format. */
export const BuilderDocumentLibrary: FC<BuilderDocumentLibraryProps> = ({
    currentFormatId,
    currentFormatName,
    inventory,
    onCreateNew,
    onDeleteDocument,
    onDuplicateDocument,
    onEditDocument,
    onOpenFormatPreview,
    onOpenPrintPreview,
    onReorderDocuments,
    onSetDefaultDocument,
    onSetDocumentEnabled,
    onTestPrintDocument,
}) => {
    const [draggedFormatId, setDraggedFormatId] = useState<string>();
    const [dropTarget, setDropTarget] = useState<DropTarget>();
    const [openActionsFormatId, setOpenActionsFormatId] = useState<string>();
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>();
    const currentDocumentSaved = inventory.some((item) => item.formatId === currentFormatId);
    const enabledCount = useMemo(
        () => inventory.filter((item) => item.isEnabled).length,
        [inventory],
    );

    const confirmDescription =
        pendingConfirmation?.kind === 'delete'
            ? `Delete "${pendingConfirmation.item.formatName}" from the document library? This cannot be undone.`
            : pendingConfirmation
              ? `Disable "${pendingConfirmation.item.formatName}" for operators? Keep at least one document enabled.`
              : '';

    const confirmLabel =
        pendingConfirmation?.kind === 'delete' ? 'Delete document' : 'Disable document';

    const confirmTitle =
        pendingConfirmation?.kind === 'delete' ? 'Delete document?' : 'Disable document?';

    const getDropPlacement = (event: DragEvent<HTMLElement>): 'before' | 'after' => {
        const rowBounds = event.currentTarget.getBoundingClientRect();
        return event.clientY > rowBounds.top + rowBounds.height / 2 ? 'after' : 'before';
    };

    const onDropRow = (event: DragEvent<HTMLElement>, targetFormatId: string) => {
        event.preventDefault();
        const transferFormatId = event.dataTransfer.getData('text/plain');
        const draggedId = draggedFormatId ?? transferFormatId;
        const placement =
            dropTarget?.formatId === targetFormatId
                ? dropTarget.placement
                : getDropPlacement(event);
        setDraggedFormatId(undefined);
        setDropTarget(undefined);
        if (!draggedId || draggedId === targetFormatId) return;
        void onReorderDocuments(draggedId, targetFormatId, placement);
    };

    return (
        <>
            <section className="builder-document-library" aria-label="Document library">
                <div className="section-heading">
                    <div className="builder-document-library-intro">
                        <p className="eyebrow">Workspace</p>
                        <h2>Available documents</h2>
                        <p>
                            Edit, duplicate, preview, print, disable, reorder, and choose the
                            default format used across VaultBill.
                        </p>
                    </div>
                    <div className="builder-document-library-actions">
                        <IconButton
                            icon={<FilePlus2 aria-hidden="true" size={18} />}
                            onClick={onCreateNew}
                        >
                            New document
                        </IconButton>
                    </div>
                </div>

                {!currentDocumentSaved ? (
                    <div className="builder-document-library-current" aria-live="polite">
                        <strong>{currentFormatName}</strong>
                        <span>Draft only. Publish it to add it to the shared library.</span>
                    </div>
                ) : null}

                <div
                    className="builder-document-library-list"
                    role="list"
                    aria-label="Saved documents"
                >
                    {inventory.length > 0 ? (
                        inventory.map((item) => {
                            const disableBlocked =
                                item.isBuiltIn ||
                                item.isDefault ||
                                (item.isEnabled && enabledCount <= 1);
                            const deleteBlocked =
                                item.isBuiltIn ||
                                item.isDefault ||
                                (item.isEnabled && enabledCount <= 1);
                            const disableBlockedReason = item.isBuiltIn
                                ? 'Built-in formats stay available.'
                                : item.isDefault
                                  ? 'Default format must remain enabled.'
                                  : item.isEnabled && enabledCount <= 1
                                    ? 'Keep at least one document enabled.'
                                    : undefined;
                            const deleteBlockedReason = item.isBuiltIn
                                ? 'Built-in formats cannot be deleted.'
                                : item.isDefault
                                  ? 'Default format cannot be deleted.'
                                  : item.isEnabled && enabledCount <= 1
                                    ? 'Keep at least one document enabled.'
                                    : undefined;

                            return (
                                <article
                                    className={`builder-document-library-row${
                                        !item.isEnabled ? ' is-disabled' : ''
                                    }`}
                                    data-drag-target={
                                        draggedFormatId && draggedFormatId !== item.formatId
                                            ? 'true'
                                            : undefined
                                    }
                                    data-drop-position={
                                        dropTarget?.formatId === item.formatId
                                            ? dropTarget.placement
                                            : undefined
                                    }
                                    key={item.formatId}
                                    onDragEnd={() => {
                                        setDraggedFormatId(undefined);
                                        setDropTarget(undefined);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'move';
                                        if (!draggedFormatId || draggedFormatId === item.formatId) {
                                            setDropTarget(undefined);
                                            return;
                                        }
                                        setDropTarget({
                                            formatId: item.formatId,
                                            placement: getDropPlacement(event),
                                        });
                                    }}
                                    onDrop={(event) => {
                                        onDropRow(event, item.formatId);
                                    }}
                                    role="listitem"
                                >
                                    <div className="builder-document-library-row-main">
                                        <DragHandleButton
                                            aria-label={`Reorder ${item.formatName}`}
                                            className="builder-document-library-drag-handle"
                                            data-cursor-drag="true"
                                            draggable
                                            onDragStart={(event) => {
                                                setDraggedFormatId(item.formatId);
                                                event.dataTransfer.effectAllowed = 'move';
                                                event.dataTransfer.setData(
                                                    'text/plain',
                                                    item.formatId,
                                                );
                                            }}
                                            icon={<GripVertical aria-hidden="true" size={18} />}
                                        />
                                        <div className="builder-document-library-row-copy">
                                            <div className="builder-document-library-row-title">
                                                <strong>{item.formatName}</strong>
                                                {item.isDefault ? (
                                                    <span className="builder-document-library-badge builder-document-library-badge--default">
                                                        Default
                                                    </span>
                                                ) : null}
                                                {item.isBuiltIn ? (
                                                    <span className="builder-document-library-badge builder-document-library-badge--muted">
                                                        Built-in
                                                    </span>
                                                ) : null}
                                                <span
                                                    aria-label={
                                                        item.isEnabled
                                                            ? `${item.formatName} is enabled`
                                                            : `${item.formatName} is disabled`
                                                    }
                                                    className={`builder-document-library-status${
                                                        item.isEnabled ? ' is-enabled' : ''
                                                    }`}
                                                    title={item.isEnabled ? 'Enabled' : 'Disabled'}
                                                />
                                            </div>
                                            <span className="builder-document-library-item-meta">
                                                {describeInventoryItem(item)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="builder-document-library-row-side">
                                        <div className="builder-document-library-row-actions">
                                            <IconOnlyButton
                                                aria-label={`Edit ${item.formatName}`}
                                                className="builder-document-library-icon-action"
                                                icon={<PencilLine aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onEditDocument(item.formatId);
                                                }}
                                                title={`Edit ${item.formatName}`}
                                            />
                                            <IconOnlyButton
                                                aria-label={`Duplicate ${item.formatName}`}
                                                className="builder-document-library-icon-action"
                                                icon={<RefreshCw aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onDuplicateDocument(item.formatId);
                                                }}
                                                title={`Duplicate ${item.formatName}`}
                                            />
                                            <IconOnlyButton
                                                aria-label={`Preview ${item.formatName}`}
                                                className="builder-document-library-icon-action"
                                                icon={<Eye aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onOpenPrintPreview(item.formatId);
                                                }}
                                                title={`Preview ${item.formatName}`}
                                            />
                                            <IconOnlyButton
                                                aria-label={`Test print ${item.formatName}`}
                                                className="builder-document-library-icon-action"
                                                icon={<Printer aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onTestPrintDocument(item.formatId);
                                                }}
                                                title={`Test print ${item.formatName}`}
                                            />
                                            <IconOnlyButton
                                                aria-label={`Delete ${item.formatName}`}
                                                className="builder-document-library-icon-action"
                                                disabled={deleteBlocked}
                                                icon={<Trash2 aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    setPendingConfirmation({
                                                        kind: 'delete',
                                                        item,
                                                    });
                                                }}
                                                title={
                                                    deleteBlockedReason ??
                                                    `Delete ${item.formatName}`
                                                }
                                            />
                                            <div
                                                className={`builder-document-library-more${
                                                    openActionsFormatId === item.formatId
                                                        ? ' is-open'
                                                        : ''
                                                }`}
                                            >
                                                <IconOnlyButton
                                                    aria-label={`More actions for ${item.formatName}`}
                                                    aria-expanded={
                                                        openActionsFormatId === item.formatId
                                                    }
                                                    className="builder-document-library-more-trigger"
                                                    icon={
                                                        <MoreHorizontal
                                                            aria-hidden="true"
                                                            size={18}
                                                        />
                                                    }
                                                    onClick={() => {
                                                        setOpenActionsFormatId((nextFormatId) =>
                                                            nextFormatId === item.formatId
                                                                ? undefined
                                                                : item.formatId,
                                                        );
                                                    }}
                                                    title={`More actions for ${item.formatName}`}
                                                />
                                                {openActionsFormatId === item.formatId ? (
                                                    <div className="builder-document-library-more-panel">
                                                        <IconButton
                                                            icon={
                                                                <Eye aria-hidden="true" size={18} />
                                                            }
                                                            onClick={() => {
                                                                void onOpenFormatPreview(
                                                                    item.formatId,
                                                                );
                                                            }}
                                                            variant="secondary"
                                                        >
                                                            Format preview
                                                        </IconButton>
                                                        <IconButton
                                                            disabled={item.isDefault}
                                                            icon={
                                                                <Star
                                                                    aria-hidden="true"
                                                                    size={18}
                                                                />
                                                            }
                                                            onClick={() => {
                                                                void onSetDefaultDocument(item);
                                                            }}
                                                            title={
                                                                item.isDefault
                                                                    ? 'This is already the default document.'
                                                                    : `Set ${item.formatName} as default`
                                                            }
                                                            variant="secondary"
                                                        >
                                                            Set default
                                                        </IconButton>
                                                        <FormField.CheckboxField
                                                            checked={item.isEnabled}
                                                            disabled={
                                                                item.isBuiltIn || item.isDefault
                                                            }
                                                            label={
                                                                item.isEnabled
                                                                    ? 'Enabled'
                                                                    : 'Disabled'
                                                            }
                                                            onChange={(event) => {
                                                                if (
                                                                    !event.currentTarget.checked &&
                                                                    disableBlocked
                                                                ) {
                                                                    return;
                                                                }
                                                                if (event.currentTarget.checked) {
                                                                    void onSetDocumentEnabled(
                                                                        item,
                                                                        true,
                                                                    );
                                                                    return;
                                                                }
                                                                setPendingConfirmation({
                                                                    kind: 'disable',
                                                                    item,
                                                                });
                                                            }}
                                                            title={
                                                                disableBlockedReason ??
                                                                `${item.formatName} availability`
                                                            }
                                                            wrapperClassName="builder-document-library-toggle"
                                                        />
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="helper-card builder-document-library-empty">
                            No saved document formats yet. Publish the current draft to add it here.
                        </div>
                    )}
                </div>
            </section>
            <AppConfirmDialog
                confirmLabel={confirmLabel}
                description={confirmDescription}
                isOpen={Boolean(pendingConfirmation)}
                onCancel={() => {
                    setPendingConfirmation(undefined);
                }}
                onConfirm={() => {
                    const nextConfirmation = pendingConfirmation;
                    setPendingConfirmation(undefined);
                    if (!nextConfirmation) return;
                    if (nextConfirmation.kind === 'delete') {
                        void onDeleteDocument(nextConfirmation.item);
                        return;
                    }
                    void onSetDocumentEnabled(nextConfirmation.item, false);
                }}
                title={confirmTitle}
            />
        </>
    );
};
