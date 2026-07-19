/** @format */

/** Generic modal wrapper used for confirmations, help, previews, and compact overlays. */

import { useCallback, useState, type FC, type PropsWithChildren, type UIEvent } from 'react';

import { X } from 'lucide-react';

import { IconOnlyButton } from '../IconOnlyButton';
import { PopupBase } from '../PopupBase';

type AppModalProps = PropsWithChildren<{
    readonly className?: string;
    readonly isOpen: boolean;
    readonly title: string;
    readonly onClose: () => void;
    readonly isDismissible?: boolean;
    readonly showScrollProgress?: boolean;
}>;

export const AppModal: FC<AppModalProps> = ({
    children,
    className,
    isDismissible = true,
    isOpen,
    onClose,
    showScrollProgress = false,
    title,
}) => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const updateScrollProgress = useCallback((event: UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        const maximum = target.scrollHeight - target.clientHeight;
        setScrollProgress(maximum > 0 ? (target.scrollTop / maximum) * 100 : 0);
    }, []);

    return (
        <PopupBase
            className={`app-modal${className ? ` ${className}` : ''}`}
            closeOnBackdrop={isDismissible}
            closeOnEscape={isDismissible}
            isOpen={isOpen}
            label={title}
            onClose={onClose}
        >
            <header className="popup-header">
                <h2>{title}</h2>
                {isDismissible ? (
                    <IconOnlyButton
                        aria-label="Close dialog"
                        className="popup-close-button"
                        icon={<X aria-hidden="true" size={18} />}
                        onClick={onClose}
                        title="Close dialog"
                    />
                ) : null}
            </header>
            <div className="popup-content" onScroll={updateScrollProgress}>
                {children}
            </div>
            {showScrollProgress ? (
                <div className="popup-scroll-rail" aria-hidden="true">
                    <span style={{ height: `${String(scrollProgress)}%` }} />
                </div>
            ) : null}
        </PopupBase>
    );
};
