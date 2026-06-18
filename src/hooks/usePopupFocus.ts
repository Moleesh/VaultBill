/** @format */

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

export const usePopupFocus = (
    isOpen: boolean,
    containerRef: RefObject<HTMLElement | null>,
    onClose: () => void,
): void => {
    const onCloseRef = useRef(onClose);

    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const previousFocus = document.activeElement;
        const container = containerRef.current;
        const focusable = container?.querySelector<HTMLElement>(
            'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
        );
        focusable?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCloseRef.current();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previousFocus instanceof HTMLElement) {
                previousFocus.focus();
            }
        };
    }, [containerRef, isOpen]);
};
