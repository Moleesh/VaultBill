/** @format */

/** Sliding drawer that edits focused record, field, and configuration details. */

import type { FC, PropsWithChildren } from 'react';

import { IconOnlyButton } from '../IconOnlyButton';
import { PopupBase } from '../PopupBase';
import { X } from 'lucide-react';

type AppDrawerProps = PropsWithChildren<{
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
}>;

export const AppDrawer: FC<AppDrawerProps> = ({ children, isOpen, onClose, title }) => (
    <PopupBase className="app-drawer" isOpen={isOpen} label={title} onClose={onClose}>
        <header className="popup-header">
            <h2>{title}</h2>
            <IconOnlyButton
                aria-label="Close drawer"
                className="popup-close-button"
                icon={<X aria-hidden="true" size={18} />}
                onClick={onClose}
                title="Close drawer"
            />
        </header>
        <div className="popup-content">{children}</div>
    </PopupBase>
);
