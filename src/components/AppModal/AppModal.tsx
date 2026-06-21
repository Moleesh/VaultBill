/** @format */

/** Generic modal wrapper used for confirmations, help, previews, and compact overlays. */

import type { FC, PropsWithChildren } from 'react';

import { IconOnlyButton } from '../IconOnlyButton';
import { PopupBase } from '../PopupBase';
import { X } from 'lucide-react';

type AppModalProps = PropsWithChildren<{
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
}>;

export const AppModal: FC<AppModalProps> = ({ children, isOpen, onClose, title }) => (
    <PopupBase className="app-modal" isOpen={isOpen} label={title} onClose={onClose}>
        <header className="popup-header">
            <h2>{title}</h2>
            <IconOnlyButton
                aria-label="Close dialog"
                className="popup-close-button"
                icon={<X aria-hidden="true" size={18} />}
                onClick={onClose}
                title="Close dialog"
            />
        </header>
        <div className="popup-content">{children}</div>
    </PopupBase>
);
