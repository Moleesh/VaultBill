/** @format */

/**
 * Desktop-only animated cursor that mirrors the hovered element's cursor intent
 * while leaving touch and reduced-precision devices on the native cursor.
 */

import { useEffect, useRef } from 'react';
import type { FC } from 'react';

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

const getCursorVariant = (target: EventTarget | null): CursorVariant => {
    if (!(target instanceof Element)) return 'default';
    if (target.closest('[disabled], [aria-disabled="true"]')) return 'disabled';
    if (target.closest('input, textarea, [contenteditable="true"]')) return 'text';

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

    useEffect(() => {
        if (!window.matchMedia('(pointer: fine)').matches) return undefined;

        const cursor = cursorRef.current;
        if (!cursor) return undefined;

        const targetPoint = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const currentPoint = { ...targetPoint };
        let frame = 0;

        document.body.classList.add('has-animated-cursor');

        const render = () => {
            currentPoint.x += (targetPoint.x - currentPoint.x) * 0.22;
            currentPoint.y += (targetPoint.y - currentPoint.y) * 0.22;
            cursor.style.transform = `translate3d(${String(currentPoint.x)}px, ${String(currentPoint.y)}px, 0)`;
            frame = window.requestAnimationFrame(render);
        };

        const setVisible = (isVisible: boolean) => {
            cursor.dataset.visible = isVisible ? 'true' : 'false';
        };

        const handlePointerMove = (event: PointerEvent) => {
            targetPoint.x = event.clientX;
            targetPoint.y = event.clientY;
            cursor.dataset.variant = getCursorVariant(event.target);
            setVisible(true);
        };

        const handlePointerDown = (event: PointerEvent) => {
            cursor.dataset.pressed = 'true';
            cursor.dataset.variant = getCursorVariant(event.target);
        };

        const handlePointerUp = (event: PointerEvent) => {
            cursor.dataset.pressed = 'false';
            cursor.dataset.variant = getCursorVariant(event.target);
        };

        const handlePointerLeave = () => {
            setVisible(false);
            cursor.dataset.pressed = 'false';
        };

        const handlePointerOver = (event: PointerEvent) => {
            cursor.dataset.variant = getCursorVariant(event.target);
        };

        cursor.dataset.variant = 'default';
        cursor.dataset.visible = 'false';
        cursor.dataset.pressed = 'false';
        frame = window.requestAnimationFrame(render);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointerleave', handlePointerLeave);
        window.addEventListener('blur', handlePointerLeave);
        document.addEventListener('pointerover', handlePointerOver);

        return () => {
            window.cancelAnimationFrame(frame);
            document.body.classList.remove('has-animated-cursor');
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointerleave', handlePointerLeave);
            window.removeEventListener('blur', handlePointerLeave);
            document.removeEventListener('pointerover', handlePointerOver);
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            className="animated-cursor"
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
