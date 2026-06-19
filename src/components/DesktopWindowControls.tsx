/** @format */

/**
 * Desktop-only Electron chrome buttons that preserve the tray-close/minimize
 * behavior while staying hidden from the web runtime.
 */

import { Minus, X } from 'lucide-react';
import type { FC } from 'react';

type DesktopWindowControlsProps = {
    readonly isDesktop?: boolean;
    readonly onMinimizeWindow?: (() => void) | undefined;
    readonly onCloseWindow?: (() => void) | undefined;
    readonly className?: string;
};

/** Renders minimize and close controls when the desktop runtime exposes them. */
export const DesktopWindowControls: FC<DesktopWindowControlsProps> = ({
    className,
    isDesktop = false,
    onCloseWindow,
    onMinimizeWindow,
}) => {
    if (!onMinimizeWindow && !onCloseWindow) {
        return null;
    }

    return (
        <div
            className={`desktop-window-controls${className ? ` ${className}` : ''}`}
            data-runtime={isDesktop ? 'desktop' : 'web'}
        >
            {onMinimizeWindow ? (
                <button
                    aria-label="Minimize to taskbar"
                    className="icon-button desktop-window-control desktop-window-control--minimize"
                    title="Minimize to taskbar"
                    onClick={onMinimizeWindow}
                    type="button"
                >
                    <Minus aria-hidden="true" size={18} />
                </button>
            ) : null}
            {onCloseWindow ? (
                <button
                    aria-label="Close to tray"
                    className="icon-button desktop-window-control desktop-window-control--close"
                    title="Close to tray"
                    onClick={onCloseWindow}
                    type="button"
                >
                    <X aria-hidden="true" size={18} />
                </button>
            ) : null}
        </div>
    );
};
