/** @format */

/** Bottom-sheet style panel used on narrow screens and compact overlays. */

import type { FC, PropsWithChildren } from 'react';

import { X } from 'lucide-react';

import { IconOnlyButton } from '../IconOnlyButton';
import { PopupBase } from '../PopupBase';

type AppSheetProps = PropsWithChildren<{
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
}>;

export const AppSheet: FC<AppSheetProps> = ({ children, isOpen, onClose, title }) => (
    <PopupBase className="app-sheet" isOpen={isOpen} label={title} onClose={onClose}>
        <header className="popup-header">
            <h2>{title}</h2>
            <IconOnlyButton
                aria-label="Close sheet"
                className="popup-close-button"
                icon={<X aria-hidden="true" size={18} />}
                onClick={onClose}
                title="Close sheet"
            />
        </header>
        <div className="popup-content">{children}</div>
    </PopupBase>
);
