/** @format */

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import type { FC, PropsWithChildren } from 'react';

import { usePopupFocus } from '../hooks/usePopupFocus';

export type PopupBaseProps = PropsWithChildren<{
    readonly className: string;
    readonly isOpen: boolean;
    readonly label: string;
    readonly onClose: () => void;
    readonly closeOnBackdrop?: boolean;
}>;

const getPortalRoot = (): HTMLElement => {
    const root = document.getElementById('portal-root');

    if (!root) {
        throw new Error('VaultBill portal root was not found.');
    }

    return root;
};

export const PopupBase: FC<PopupBaseProps> = ({
    children,
    className,
    closeOnBackdrop = true,
    isOpen,
    label,
    onClose,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    usePopupFocus(isOpen, popupRef, onClose);

    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div
            className="popup-backdrop"
            onMouseDown={(event) => {
                if (closeOnBackdrop && event.currentTarget === event.target) {
                    onClose();
                }
            }}
        >
            <div
                aria-label={label}
                aria-modal="true"
                className={`popup-frame ${className}`}
                ref={popupRef}
                role="dialog"
            >
                {children}
            </div>
        </div>,
        getPortalRoot(),
    );
};
