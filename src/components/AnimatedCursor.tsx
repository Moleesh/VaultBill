/** @format */

/**
 * Desktop-only animated cursor that mirrors the hovered element's cursor intent
 * while leaving touch and reduced-precision devices on the native cursor.
 */

import type { FC } from 'react';
import { useEffect, useRef } from 'react';

type CursorVariant =
    | 'default'
    | 'hand'
    | 'text'
    | 'drag'
    | 'dragging'
    | 'disabled'
    | 'help'
    | 'resize'
    | 'busy'
    | 'move';

type CursorInteraction = 'idle' | 'button' | 'field' | 'link' | 'menu' | 'drag';

const getCursorInteraction = (target: EventTarget | null): CursorInteraction => {
    if (!(target instanceof Element)) return 'idle';
    if (target.closest('[draggable="true"], [data-cursor-drag="true"]')) return 'drag';
    if (target.closest('a[href], [role="link"]')) return 'link';
    if (
        target.closest(
            '[role="option"], [role="menuitem"], [role="tab"], [data-cursor-menu="true"]',
        )
    ) {
        return 'menu';
    }
    if (target.closest('input, textarea, select, [contenteditable="true"]')) return 'field';
    if (
        target.closest('button, [type="button"], [type="submit"], [role="button"], summary, label')
    ) {
        return 'button';
    }
    return 'idle';
};

const getCursorVariant = (target: EventTarget | null): CursorVariant => {
    if (!(target instanceof Element)) return 'default';
    if (target.closest('[disabled], [aria-disabled="true"]')) return 'disabled';
    if (target.closest('input, textarea, [contenteditable="true"]')) return 'text';
    if (target.closest('[draggable="true"], [data-cursor-drag="true"]')) return 'drag';

    const { cursor } = window.getComputedStyle(target);

    if (cursor === 'pointer') return 'hand';
    if (cursor === 'text' || cursor === 'vertical-text') return 'text';
    if (cursor === 'grab') return 'drag';
    if (cursor === 'grabbing') return 'dragging';
    if (cursor === 'not-allowed' || cursor === 'no-drop') return 'disabled';
    if (cursor === 'help') return 'help';
    if (cursor === 'wait' || cursor === 'progress') return 'busy';
    if (cursor === 'move' || cursor === 'all-scroll') return 'move';
    if (cursor.includes('resize')) return 'resize';

    return 'default';
};

/** Adds an animated cursor overlay for fine-pointer devices. */
export const AnimatedCursor: FC = () => {
    const cursorRef = useRef<HTMLDivElement | null>(null);
    const pointerInteractionResetTimeoutRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!window.matchMedia('(pointer: fine)').matches) return undefined;

        const cursor = cursorRef.current;
        if (!cursor) return undefined;

        document.body.classList.add('has-animated-cursor');

        const positionCursor = (x: number, y: number) => {
            cursor.style.transform = `translate3d(${String(x)}px, ${String(y)}px, 0)`;
        };

        const setVisible = (isVisible: boolean) => {
            cursor.dataset.visible = isVisible ? 'true' : 'false';
        };

        const setInteraction = (interaction: CursorInteraction) => {
            cursor.dataset.interaction = interaction;
        };

        const setVariant = (target: EventTarget | null) => {
            cursor.dataset.variant = getCursorVariant(target);
        };

        const handlePointerMove = (event: PointerEvent) => {
            positionCursor(event.clientX, event.clientY);
            setVariant(event.target);
            if (cursor.dataset.pressed !== 'true') {
                setInteraction(getCursorInteraction(event.target));
            }
            setVisible(true);
        };

        const handlePointerDown = (event: PointerEvent) => {
            cursor.dataset.pressed = 'true';
            setVariant(event.target);
            setInteraction(getCursorInteraction(event.target));
        };

        const handlePointerUp = (event: PointerEvent) => {
            cursor.dataset.pressed = 'false';
            setVariant(event.target);
            window.clearTimeout(pointerInteractionResetTimeoutRef.current);
            pointerInteractionResetTimeoutRef.current = window.setTimeout(() => {
                setInteraction(getCursorInteraction(event.target));
            }, 110);
        };

        const handleDragStart = () => {
            cursor.dataset.variant = 'dragging';
            setInteraction('drag');
        };

        const handleDragEnd = () => {
            cursor.dataset.variant = 'drag';
            cursor.dataset.pressed = 'false';
            setInteraction('idle');
        };

        const handlePointerLeave = () => {
            setVisible(false);
            cursor.dataset.pressed = 'false';
            setInteraction('idle');
        };

        const handlePointerOver = (event: PointerEvent) => {
            setVariant(event.target);
            if (cursor.dataset.pressed !== 'true') {
                setInteraction(getCursorInteraction(event.target));
            }
        };

        cursor.dataset.variant = 'default';
        cursor.dataset.visible = 'false';
        cursor.dataset.interaction = 'idle';
        cursor.dataset.pressed = 'false';

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointerleave', handlePointerLeave);
        window.addEventListener('blur', handlePointerLeave);
        window.addEventListener('dragstart', handleDragStart, true);
        window.addEventListener('dragend', handleDragEnd, true);
        document.addEventListener('pointerover', handlePointerOver);

        return () => {
            window.clearTimeout(pointerInteractionResetTimeoutRef.current);
            document.body.classList.remove('has-animated-cursor');
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointerleave', handlePointerLeave);
            window.removeEventListener('blur', handlePointerLeave);
            window.removeEventListener('dragstart', handleDragStart, true);
            window.removeEventListener('dragend', handleDragEnd, true);
            document.removeEventListener('pointerover', handlePointerOver);
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            className="animated-cursor"
            data-interaction="idle"
            data-pressed="false"
            data-variant="default"
            data-visible="false"
            ref={cursorRef}
        >
            <span className="animated-cursor-core" />
            <span className="animated-cursor-ring" />
            <span className="animated-cursor-spark" />
        </div>
    );
};
