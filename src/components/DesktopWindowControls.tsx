/** @format */

/**
 * Desktop-only Electron chrome buttons that preserve the tray-close/minimize
 * behavior while staying hidden from the web runtime.
 */

import { Minus, X } from 'lucide-react';
import type { FC } from 'react';

type DesktopWindowControlsProps = {
    readonly isDesktop?: boolean;
    readonly onMinimizeWindow?: () => void;
    readonly onCloseWindow?: () => void;
    readonly className?: string;
};

export const DesktopWindowControls: FC<DesktopWindowControlsProps> = ({
    className,
    isDesktop = false,
    onCloseWindow,
    onMinimizeWindow,
}) => {
    if (!isDesktop || !onMinimizeWindow || !onCloseWindow) {
        return null;
    }

    return (
        <div className={`desktop-window-controls${className ? ` ${className}` : ''}`}>
            <button
                aria-label="Minimize window"
                className="icon-button"
                onClick={onMinimizeWindow}
                type="button"
            >
                <Minus aria-hidden="true" size={18} />
            </button>
            <button
                aria-label="Close window"
                className="icon-button"
                onClick={onCloseWindow}
                type="button"
            >
                <X aria-hidden="true" size={18} />
            </button>
        </div>
    );
};
