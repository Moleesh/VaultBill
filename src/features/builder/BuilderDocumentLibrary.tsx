/** @format */
/* eslint-disable max-lines */

import type { DragEvent, FC } from 'react';
import { useMemo, useState } from 'react';

import {
    ArrowDownToLine,
    Eye,
    FilePlus2,
    GripVertical,
    Printer,
    RefreshCw,
    Star,
    Trash2,
} from 'lucide-react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
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

    const onDropRow = (event: DragEvent<HTMLElement>, targetFormatId: string) => {
        event.preventDefault();
        const draggedId = draggedFormatId;
        setDraggedFormatId(undefined);
        if (!draggedId || draggedId === targetFormatId) return;
        void onReorderDocuments(draggedId, targetFormatId);
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
                            const isCurrent = item.formatId === currentFormatId;
                            const disableBlocked =
                                item.isBuiltIn ||
                                item.isDefault ||
                                (!item.isEnabled && enabledCount <= 1);

                            return (
                                <article
                                    className={`builder-document-library-row${isCurrent ? ' is-current' : ''}${
                                        !item.isEnabled ? ' is-disabled' : ''
                                    }`}
                                    draggable
                                    key={item.formatId}
                                    onDragEnd={() => {
                                        setDraggedFormatId(undefined);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                    }}
                                    onDrop={(event) => {
                                        onDropRow(event, item.formatId);
                                    }}
                                    role="listitem"
                                >
                                    <div className="builder-document-library-row-main">
                                        <button
                                            aria-label={`Reorder ${item.formatName}`}
                                            className="builder-document-library-drag-handle"
                                            draggable
                                            onDragStart={() => {
                                                setDraggedFormatId(item.formatId);
                                            }}
                                            type="button"
                                        >
                                            <GripVertical aria-hidden="true" size={18} />
                                        </button>
                                        <div className="builder-document-library-row-copy">
                                            <div className="builder-document-library-row-title">
                                                <strong>{item.formatName}</strong>
                                                {isCurrent ? (
                                                    <span className="builder-document-library-badge">
                                                        Current
                                                    </span>
                                                ) : null}
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
                                                {!item.isEnabled ? (
                                                    <span className="builder-document-library-badge builder-document-library-badge--muted">
                                                        Disabled
                                                    </span>
                                                ) : null}
                                            </div>
                                            <span className="builder-document-library-item-meta">
                                                {describeInventoryItem(item)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="builder-document-library-row-side">
                                        <div className="builder-document-library-row-actions">
                                            <IconButton
                                                icon={
                                                    <ArrowDownToLine aria-hidden="true" size={18} />
                                                }
                                                onClick={() => {
                                                    void onEditDocument(item.formatId);
                                                }}
                                                variant={isCurrent ? 'primary' : 'secondary'}
                                            >
                                                Edit
                                            </IconButton>
                                            <IconButton
                                                icon={<RefreshCw aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onDuplicateDocument(item.formatId);
                                                }}
                                                variant="secondary"
                                            >
                                                Duplicate
                                            </IconButton>
                                            <IconButton
                                                icon={<Eye aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onOpenFormatPreview(item.formatId);
                                                }}
                                                variant="secondary"
                                            >
                                                Format preview
                                            </IconButton>
                                            <IconButton
                                                icon={<Printer aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onOpenPrintPreview(item.formatId);
                                                }}
                                                variant="secondary"
                                            >
                                                Print preview
                                            </IconButton>
                                            <IconButton
                                                icon={<Printer aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onTestPrintDocument(item.formatId);
                                                }}
                                                variant="secondary"
                                            >
                                                Test print
                                            </IconButton>
                                            <IconButton
                                                disabled={item.isDefault}
                                                icon={<Star aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    void onSetDefaultDocument(item);
                                                }}
                                                variant="secondary"
                                            >
                                                Set default
                                            </IconButton>
                                        </div>
                                        <div className="builder-document-library-row-foot">
                                            <FormField.CheckboxField
                                                checked={item.isEnabled}
                                                disabled={item.isBuiltIn || item.isDefault}
                                                label="Enabled"
                                                note={
                                                    item.isBuiltIn
                                                        ? 'Built-in formats stay available.'
                                                        : item.isDefault
                                                          ? 'Default format must remain enabled.'
                                                          : undefined
                                                }
                                                onChange={(event) => {
                                                    if (
                                                        !event.currentTarget.checked &&
                                                        disableBlocked
                                                    ) {
                                                        return;
                                                    }
                                                    if (event.currentTarget.checked) {
                                                        void onSetDocumentEnabled(item, true);
                                                        return;
                                                    }
                                                    setPendingConfirmation({
                                                        kind: 'disable',
                                                        item,
                                                    });
                                                }}
                                                wrapperClassName="builder-document-library-toggle"
                                            />
                                            <IconButton
                                                disabled={item.isBuiltIn || item.isDefault}
                                                icon={<Trash2 aria-hidden="true" size={18} />}
                                                onClick={() => {
                                                    setPendingConfirmation({
                                                        kind: 'delete',
                                                        item,
                                                    });
                                                }}
                                                variant="secondary"
                                            >
                                                Delete
                                            </IconButton>
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
