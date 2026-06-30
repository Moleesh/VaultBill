/** @format */

/**
 * Desktop-only Electron chrome buttons that preserve the tray-close/minimize
 * behavior while staying hidden from the web runtime.
 */

import { Minus, RotateCcw, X } from 'lucide-react';
import type { FC } from 'react';

import { IconOnlyButton } from './IconOnlyButton';

type DesktopWindowControlsProps = {
    readonly isDesktop?: boolean;
    readonly onRefreshWindow?: (() => void) | undefined;
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
    onRefreshWindow,
}) => {
    if (!onRefreshWindow && !onMinimizeWindow && !onCloseWindow) {
        return null;
    }

    return (
        <div
            className={`desktop-window-controls${className ? ` ${className}` : ''}`}
            data-runtime={isDesktop ? 'desktop' : 'web'}
        >
            {onMinimizeWindow ? (
                <IconOnlyButton
                    aria-label="Minimize to taskbar"
                    className="icon-button desktop-window-control desktop-window-control--minimize"
                    icon={<Minus aria-hidden="true" size={18} />}
                    onClick={onMinimizeWindow}
                    title="Minimize to taskbar"
                />
            ) : null}
            {isDesktop && onRefreshWindow ? (
                <IconOnlyButton
                    aria-label="Refresh window"
                    className="icon-button desktop-window-control desktop-window-control--refresh"
                    icon={<RotateCcw aria-hidden="true" size={18} />}
                    onClick={onRefreshWindow}
                    title="Refresh window"
                />
            ) : null}
            {onCloseWindow ? (
                <IconOnlyButton
                    aria-label="Close to tray"
                    className="icon-button desktop-window-control desktop-window-control--close"
                    icon={<X aria-hidden="true" size={18} />}
                    onClick={onCloseWindow}
                    title="Close to tray"
                />
            ) : null}
        </div>
    );
};
