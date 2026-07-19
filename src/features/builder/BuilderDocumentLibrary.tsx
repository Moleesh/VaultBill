/** @format */
/* eslint-disable max-lines, @typescript-eslint/no-unnecessary-condition */

import type { FC, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
    Eye,
    FilePlus2,
    GripVertical,
    MoreHorizontal,
    PencilLine,
    Power,
    PowerOff,
    Printer,
    RefreshCw,
    BadgeCheck,
    Trash2,
} from 'lucide-react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { DragHandleButton } from '../../components/DragHandleButton';
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
          readonly kind: 'delete';
          readonly item: BuilderInventoryItem;
      }
    | undefined;

type DropTarget = {
    readonly formatId: string;
    readonly placement: 'before' | 'after';
};

type PointerDrag = {
    readonly formatId: string;
    readonly pointerId: number;
    readonly startX: number;
    readonly startY: number;
    moved: boolean;
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
    const [settledDropFormatId, setSettledDropFormatId] = useState<string>();
    const [openActionsFormatId, setOpenActionsFormatId] = useState<string>();
    const [selectedReorderFormatId, setSelectedReorderFormatId] = useState<string>();
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>();
    const actionsMenuRef = useRef<HTMLDivElement | null>(null);
    const pointerDragRef = useRef<PointerDrag | undefined>(undefined);
    const suppressHandleClickRef = useRef(false);
    const currentDocumentSaved = inventory.some((item) => item.formatId === currentFormatId);
    const enabledCount = useMemo(
        () => inventory.filter((item) => item.isEnabled).length,
        [inventory],
    );
    const confirmDescription = pendingConfirmation
        ? `Delete "${pendingConfirmation.item.formatName}" from the document library? This cannot be undone.`
        : '';
    const confirmLabel = 'Delete document';
    const confirmTitle = 'Delete document?';

    useEffect(() => {
        if (!openActionsFormatId) return undefined;

        const closeWhenClickingOutside = (event: PointerEvent) => {
            if (event.target instanceof Node && actionsMenuRef.current?.contains(event.target)) {
                return;
            }
            setOpenActionsFormatId(undefined);
        };

        document.addEventListener('pointerdown', closeWhenClickingOutside);
        return () => {
            document.removeEventListener('pointerdown', closeWhenClickingOutside);
        };
    }, [openActionsFormatId]);

    const getDropPlacement = (row: HTMLElement, clientY: number): 'before' | 'after' => {
        const rowBounds = row.getBoundingClientRect();
        return clientY > rowBounds.top + rowBounds.height / 2 ? 'after' : 'before';
    };

    const markDropSettled = (formatId: string) => {
        setSettledDropFormatId(formatId);
        window.setTimeout(() => {
            setSettledDropFormatId((currentFormatId) =>
                currentFormatId === formatId ? undefined : currentFormatId,
            );
        }, 520);
    };

    const finishPointerReorder = () => {
        const draggedId = pointerDragRef.current?.formatId;
        const target = dropTarget;
        pointerDragRef.current = undefined;
        setDraggedFormatId(undefined);
        setDropTarget(undefined);
        if (!draggedId || !target || draggedId === target.formatId) return;
        void onReorderDocuments(draggedId, target.formatId, target.placement);
        markDropSettled(draggedId);
    };

    const updatePointerDropTarget = (event: ReactPointerEvent<HTMLElement>) => {
        const dragState = pointerDragRef.current;
        if (!dragState) return;

        const movedDistance = Math.hypot(
            event.clientX - dragState.startX,
            event.clientY - dragState.startY,
        );
        if (movedDistance > 4) dragState.moved = true;
        if (!dragState.moved) return;

        const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
        const hoveredRow = hoveredElement?.closest<HTMLElement>(
            '.builder-document-library-row[data-format-id]',
        );
        const targetFormatId = hoveredRow?.dataset.formatId;
        if (!hoveredRow || !targetFormatId || targetFormatId === dragState.formatId) {
            setDropTarget(undefined);
            return;
        }

        setDropTarget({
            formatId: targetFormatId,
            placement: getDropPlacement(hoveredRow, event.clientY),
        });
    };

    const requestEnabledChange = (item: BuilderInventoryItem, nextIsEnabled: boolean) => {
        void onSetDocumentEnabled(item, nextIsEnabled);
    };

    const onReorderHandleClick = (item: BuilderInventoryItem) => {
        setOpenActionsFormatId(undefined);
        setSelectedReorderFormatId((currentFormatId) =>
            currentFormatId === item.formatId ? undefined : item.formatId,
        );
    };

    const completeSelectedReorder = (
        targetFormatId: string,
        placement: 'before' | 'after' = 'before',
    ) => {
        const movedFormatId = selectedReorderFormatId;
        if (!movedFormatId || movedFormatId === targetFormatId) return;
        void onReorderDocuments(movedFormatId, targetFormatId, placement);
        markDropSettled(movedFormatId);
        setSelectedReorderFormatId(undefined);
    };

    const keepMenuInteractionLocal = (
        event: KeyboardEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>,
    ) => {
        event.stopPropagation();
    };

    return (
        <>
            <section
                className="builder-document-library"
                aria-label="Document library"
                data-dragging={draggedFormatId ? 'true' : undefined}
            >
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
                            const disableBlocked = item.isDefault;
                            const deleteBlocked =
                                item.isBuiltIn ||
                                item.isDefault ||
                                (item.isEnabled && enabledCount <= 1);
                            const disableBlockedReason = item.isDefault
                                ? 'Default format must remain enabled.'
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
                                    }${
                                        openActionsFormatId === item.formatId
                                            ? ' is-actions-open'
                                            : ''
                                    }`}
                                    data-drag-target={
                                        (draggedFormatId && draggedFormatId !== item.formatId) ||
                                        (selectedReorderFormatId &&
                                            selectedReorderFormatId !== item.formatId)
                                            ? 'true'
                                            : undefined
                                    }
                                    data-drop-position={
                                        dropTarget?.formatId === item.formatId
                                            ? dropTarget.placement
                                            : undefined
                                    }
                                    data-reorder-selected={
                                        selectedReorderFormatId === item.formatId
                                            ? 'true'
                                            : undefined
                                    }
                                    data-dragging={
                                        draggedFormatId === item.formatId ? 'true' : undefined
                                    }
                                    data-drop-settled={
                                        settledDropFormatId === item.formatId ? 'true' : undefined
                                    }
                                    data-format-id={item.formatId}
                                    key={item.formatId}
                                    onClick={() => {
                                        completeSelectedReorder(item.formatId);
                                    }}
                                    role="listitem"
                                >
                                    <div className="builder-document-library-row-main">
                                        <DragHandleButton
                                            aria-label={`Reorder ${item.formatName}`}
                                            className="builder-document-library-drag-handle"
                                            data-cursor-drag="true"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                if (suppressHandleClickRef.current) {
                                                    suppressHandleClickRef.current = false;
                                                    return;
                                                }
                                                onReorderHandleClick(item);
                                            }}
                                            onPointerCancel={(event) => {
                                                if (
                                                    pointerDragRef.current?.pointerId !==
                                                    event.pointerId
                                                ) {
                                                    return;
                                                }
                                                pointerDragRef.current = undefined;
                                                setDraggedFormatId(undefined);
                                                setDropTarget(undefined);
                                            }}
                                            onPointerDown={(event) => {
                                                if (event.button !== 0) return;
                                                event.stopPropagation();
                                                setOpenActionsFormatId(undefined);
                                                setSelectedReorderFormatId(undefined);
                                                pointerDragRef.current = {
                                                    formatId: item.formatId,
                                                    pointerId: event.pointerId,
                                                    startX: event.clientX,
                                                    startY: event.clientY,
                                                    moved: false,
                                                };
                                                setDraggedFormatId(item.formatId);
                                                event.currentTarget.setPointerCapture?.(
                                                    event.pointerId,
                                                );
                                            }}
                                            onPointerMove={(event) => {
                                                if (
                                                    pointerDragRef.current?.pointerId !==
                                                    event.pointerId
                                                ) {
                                                    return;
                                                }
                                                event.preventDefault();
                                                updatePointerDropTarget(event);
                                            }}
                                            onPointerUp={(event) => {
                                                const dragState = pointerDragRef.current;
                                                if (dragState?.pointerId !== event.pointerId) {
                                                    return;
                                                }
                                                event.preventDefault();
                                                event.stopPropagation();
                                                suppressHandleClickRef.current = true;
                                                if (
                                                    event.currentTarget.hasPointerCapture?.(
                                                        event.pointerId,
                                                    )
                                                ) {
                                                    event.currentTarget.releasePointerCapture?.(
                                                        event.pointerId,
                                                    );
                                                }
                                                if (dragState.moved) {
                                                    finishPointerReorder();
                                                    return;
                                                }
                                                pointerDragRef.current = undefined;
                                                setDraggedFormatId(undefined);
                                                setDropTarget(undefined);
                                                onReorderHandleClick(item);
                                            }}
                                            title={
                                                selectedReorderFormatId === item.formatId
                                                    ? 'Click another document row to move this document.'
                                                    : `Reorder ${item.formatName}`
                                            }
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
                                            {selectedReorderFormatId === item.formatId ? (
                                                <span className="builder-document-library-reorder-hint">
                                                    Pick where this document should move.
                                                </span>
                                            ) : null}
                                            {selectedReorderFormatId &&
                                            selectedReorderFormatId !== item.formatId ? (
                                                <div
                                                    className="builder-document-library-reorder-targets"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                    }}
                                                >
                                                    <IconButton
                                                        onClick={() => {
                                                            completeSelectedReorder(
                                                                item.formatId,
                                                                'before',
                                                            );
                                                        }}
                                                        variant="secondary"
                                                    >
                                                        Place before
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={() => {
                                                            completeSelectedReorder(
                                                                item.formatId,
                                                                'after',
                                                            );
                                                        }}
                                                        variant="secondary"
                                                    >
                                                        Place after
                                                    </IconButton>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div
                                        className="builder-document-library-row-side"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
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
                                                aria-label={
                                                    item.isDefault
                                                        ? `${item.formatName} is default`
                                                        : `Set ${item.formatName} as default`
                                                }
                                                className={`builder-document-library-icon-action builder-document-library-default-action${
                                                    item.isDefault ? ' is-default' : ''
                                                }`}
                                                disabled={item.isDefault}
                                                icon={
                                                    <BadgeCheck
                                                        aria-hidden="true"
                                                        fill={
                                                            item.isDefault ? 'currentColor' : 'none'
                                                        }
                                                        size={18}
                                                        strokeWidth={item.isDefault ? 2.4 : 2}
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
                                            />
                                            <IconOnlyButton
                                                aria-label={
                                                    item.isEnabled
                                                        ? `Disable ${item.formatName}`
                                                        : `Enable ${item.formatName}`
                                                }
                                                className={`builder-document-library-icon-action builder-document-library-availability-action${
                                                    item.isEnabled ? ' is-enabled' : ' is-disabled'
                                                }`}
                                                disabled={item.isEnabled && disableBlocked}
                                                icon={
                                                    item.isEnabled ? (
                                                        <Power
                                                            aria-hidden="true"
                                                            size={18}
                                                            strokeWidth={2.35}
                                                        />
                                                    ) : (
                                                        <PowerOff
                                                            aria-hidden="true"
                                                            size={18}
                                                            strokeWidth={2.35}
                                                        />
                                                    )
                                                }
                                                onClick={() => {
                                                    requestEnabledChange(item, !item.isEnabled);
                                                }}
                                                title={
                                                    disableBlockedReason ??
                                                    (item.isEnabled
                                                        ? `Disable ${item.formatName}`
                                                        : `Enable ${item.formatName}`)
                                                }
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
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Escape') {
                                                        event.stopPropagation();
                                                        setOpenActionsFormatId(undefined);
                                                    }
                                                }}
                                                onPointerDown={keepMenuInteractionLocal}
                                                ref={
                                                    openActionsFormatId === item.formatId
                                                        ? actionsMenuRef
                                                        : undefined
                                                }
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
                                                                <RefreshCw
                                                                    aria-hidden="true"
                                                                    size={18}
                                                                />
                                                            }
                                                            onClick={() => {
                                                                void onDuplicateDocument(
                                                                    item.formatId,
                                                                );
                                                            }}
                                                            variant="secondary"
                                                        >
                                                            Duplicate
                                                        </IconButton>
                                                        <IconButton
                                                            icon={
                                                                <Eye aria-hidden="true" size={18} />
                                                            }
                                                            onClick={() => {
                                                                void onOpenFormatPreview(
                                                                    item.formatId,
                                                                );
                                                                setOpenActionsFormatId(undefined);
                                                            }}
                                                            variant="secondary"
                                                        >
                                                            Field preview
                                                        </IconButton>
                                                        <IconButton
                                                            icon={
                                                                <Eye aria-hidden="true" size={18} />
                                                            }
                                                            onClick={() => {
                                                                void onOpenPrintPreview(
                                                                    item.formatId,
                                                                );
                                                                setOpenActionsFormatId(undefined);
                                                            }}
                                                            variant="secondary"
                                                        >
                                                            Print preview
                                                        </IconButton>
                                                        <IconButton
                                                            icon={
                                                                <Printer
                                                                    aria-hidden="true"
                                                                    size={18}
                                                                />
                                                            }
                                                            onClick={() => {
                                                                void onTestPrintDocument(
                                                                    item.formatId,
                                                                );
                                                                setOpenActionsFormatId(undefined);
                                                            }}
                                                            variant="secondary"
                                                        >
                                                            Test print
                                                        </IconButton>
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
                    void onDeleteDocument(nextConfirmation.item);
                }}
                title={confirmTitle}
            />
        </>
    );
};
