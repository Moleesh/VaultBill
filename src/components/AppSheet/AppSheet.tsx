/** @format */

import type { FC, PropsWithChildren } from 'react';

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
            <button onClick={onClose} type="button">
                Close
            </button>
        </header>
        <div className="popup-content">{children}</div>
    </PopupBase>
);
