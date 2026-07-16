/** @format */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

export type ReorderPlacement = 'before' | 'after';

type DropTarget = {
    readonly id: string;
    readonly placement: ReorderPlacement;
};

type PointerDrag = {
    readonly id: string;
    readonly pointerId: number;
    readonly startX: number;
    readonly startY: number;
    moved: boolean;
};

type UsePointerReorderOptions = {
    readonly onReorder: (
        draggedId: string,
        targetId: string,
        placement: ReorderPlacement,
    ) => Promise<void> | void;
    readonly rowSelector: string;
    readonly settleMs?: number;
};

/** Shared pointer-based row reordering used by builder management lists. */
export const usePointerReorder = ({
    onReorder,
    rowSelector,
    settleMs = 520,
}: UsePointerReorderOptions) => {
    const [draggedId, setDraggedId] = useState<string>();
    const [dropTarget, setDropTarget] = useState<DropTarget>();
    const [settledId, setSettledId] = useState<string>();
    const [selectedId, setSelectedId] = useState<string>();
    const pointerDragRef = useRef<PointerDrag | undefined>(undefined);
    const dropTargetRef = useRef<DropTarget | undefined>(undefined);
    const suppressHandleClickRef = useRef(false);

    const getDropPlacement = (row: HTMLElement, clientY: number): ReorderPlacement => {
        const rowBounds = row.getBoundingClientRect();
        return clientY > rowBounds.top + rowBounds.height / 2 ? 'after' : 'before';
    };

    const markSettled = (id: string) => {
        setSettledId(id);
        window.setTimeout(() => {
            setSettledId((currentId) => (currentId === id ? undefined : currentId));
        }, settleMs);
    };

    const resetDrag = () => {
        pointerDragRef.current = undefined;
        setDraggedId(undefined);
        dropTargetRef.current = undefined;
        setDropTarget(undefined);
    };

    const setActiveDropTarget = (target: DropTarget | undefined) => {
        dropTargetRef.current = target;
        setDropTarget(target);
    };

    const finishReorder = () => {
        const draggedRowId = pointerDragRef.current?.id;
        const target = dropTargetRef.current;
        resetDrag();
        if (!draggedRowId || !target || draggedRowId === target.id) return;
        void onReorder(draggedRowId, target.id, target.placement);
        markSettled(draggedRowId);
    };

    const toggleSelected = (id: string) => {
        setSelectedId((currentId) => (currentId === id ? undefined : id));
    };

    const completeSelectedReorder = (targetId: string, placement: ReorderPlacement) => {
        const draggedRowId = selectedId;
        if (!draggedRowId || draggedRowId === targetId) return;
        setSelectedId(undefined);
        void onReorder(draggedRowId, targetId, placement);
        markSettled(draggedRowId);
    };

    const toggleSelectedFromHandle = (id: string) => {
        if (suppressHandleClickRef.current) {
            suppressHandleClickRef.current = false;
            return;
        }
        toggleSelected(id);
    };

    const updateDropTargetFromPoint = (clientX: number, clientY: number) => {
        const dragState = pointerDragRef.current;
        if (!dragState) return;

        const movedDistance = Math.hypot(clientX - dragState.startX, clientY - dragState.startY);
        if (movedDistance > 4) dragState.moved = true;
        if (!dragState.moved) return;

        const hoveredElement = document.elementFromPoint(clientX, clientY);
        const hoveredRow = hoveredElement?.closest<HTMLElement>(rowSelector);
        const targetId = hoveredRow?.dataset.reorderId;
        if (!hoveredRow || !targetId || targetId === dragState.id) {
            setActiveDropTarget(undefined);
            return;
        }

        setActiveDropTarget({
            id: targetId,
            placement: getDropPlacement(hoveredRow, clientY),
        });
    };

    useEffect(() => {
        if (!draggedId) return undefined;

        const finishOrReset = () => {
            if (pointerDragRef.current?.moved) {
                suppressHandleClickRef.current = true;
                finishReorder();
                window.setTimeout(() => {
                    suppressHandleClickRef.current = false;
                }, 0);
                return;
            }
            resetDrag();
        };
        const updateFromPointer = (event: PointerEvent) => {
            if (pointerDragRef.current?.pointerId !== event.pointerId) return;
            event.preventDefault();
            updateDropTargetFromPoint(event.clientX, event.clientY);
        };
        const resetOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') resetDrag();
        };

        window.addEventListener('pointermove', updateFromPointer, { passive: false });
        window.addEventListener('pointerup', finishOrReset);
        window.addEventListener('pointercancel', resetDrag);
        window.addEventListener('keydown', resetOnEscape);
        return () => {
            window.removeEventListener('pointermove', updateFromPointer);
            window.removeEventListener('pointerup', finishOrReset);
            window.removeEventListener('pointercancel', resetDrag);
            window.removeEventListener('keydown', resetOnEscape);
        };
    }, [draggedId, rowSelector]); // eslint-disable-line react-hooks/exhaustive-deps

    const getRowState = (id: string) => ({
        'data-drag-target':
            (draggedId && draggedId !== id) || (selectedId && selectedId !== id)
                ? 'true'
                : undefined,
        'data-dragging': draggedId === id ? 'true' : undefined,
        'data-drop-position': dropTarget?.id === id ? dropTarget.placement : undefined,
        'data-drop-settled': settledId === id ? 'true' : undefined,
        'data-reorder-selected': selectedId === id ? 'true' : undefined,
        'data-reorder-id': id,
    });

    const getRowProps = (id: string) => ({
        ...getRowState(id),
        draggable: false,
        onDragStart: (event: ReactDragEvent<HTMLElement>) => {
            event.preventDefault();
        },
    });

    const getHandleProps = (id: string) => ({
        'data-cursor-drag': 'true',
        onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => {
            if (pointerDragRef.current?.pointerId !== event.pointerId) return;
            resetDrag();
        },
        onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            setSelectedId(undefined);
            pointerDragRef.current = {
                id,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
            };
            setDraggedId(id);
            event.currentTarget.setPointerCapture?.(event.pointerId);
        },
        onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
            if (pointerDragRef.current?.pointerId !== event.pointerId) return;
            event.preventDefault();
            updateDropTargetFromPoint(event.clientX, event.clientY);
        },
        onPointerUp: (event: ReactPointerEvent<HTMLElement>) => {
            const dragState = pointerDragRef.current;
            if (dragState?.pointerId !== event.pointerId) return;
            event.preventDefault();
            event.stopPropagation();
            if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                event.currentTarget.releasePointerCapture?.(event.pointerId);
            }
            if (dragState.moved) {
                suppressHandleClickRef.current = true;
                finishReorder();
                window.setTimeout(() => {
                    suppressHandleClickRef.current = false;
                }, 0);
                return;
            }
            resetDrag();
        },
    });

    return {
        draggedId,
        completeSelectedReorder,
        getHandleProps,
        getRowProps,
        getRowState,
        selectedId,
        toggleSelected,
        toggleSelectedFromHandle,
    };
};
