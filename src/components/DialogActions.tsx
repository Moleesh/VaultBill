/** @format */

import type { FC, PropsWithChildren } from 'react';

type DialogActionsProps = PropsWithChildren<{
    readonly className?: string;
}>;

/** Shared footer wrapper for popup and dialog actions. */
export const DialogActions: FC<DialogActionsProps> = ({ children, className }) => (
    <div className={className ? `popup-actions ${className}` : 'popup-actions'}>{children}</div>
);
