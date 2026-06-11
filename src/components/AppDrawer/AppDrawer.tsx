/** @format */

import type { FC, PropsWithChildren } from 'react';

import { PopupBase } from '../PopupBase';

type AppDrawerProps = PropsWithChildren<{
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
}>;

export const AppDrawer: FC<AppDrawerProps> = ({ children, isOpen, onClose, title }) => (
    <PopupBase className="app-drawer" isOpen={isOpen} label={title} onClose={onClose}>
        <header className="popup-header">
            <h2>{title}</h2>
            <button onClick={onClose} type="button">
                Close
            </button>
        </header>
        <div className="popup-content">{children}</div>
    </PopupBase>
);
