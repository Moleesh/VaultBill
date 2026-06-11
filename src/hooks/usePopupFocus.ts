/** @format */

import { useEffect } from 'react';
import type { RefObject } from 'react';

export const usePopupFocus = (
    isOpen: boolean,
    containerRef: RefObject<HTMLElement | null>,
    onClose: () => void,
): void => {
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
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previousFocus instanceof HTMLElement) {
                previousFocus.focus();
            }
        };
    }, [containerRef, isOpen, onClose]);
};
