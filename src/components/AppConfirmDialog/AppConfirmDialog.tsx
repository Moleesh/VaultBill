/** @format */

/** Focus-trapped confirmation dialog for destructive and irreversible actions. */

import type { FC } from 'react';

import { ActionButton } from '../ActionButton';
import { DialogActions } from '../DialogActions';
import { PopupBase } from '../PopupBase';

type AppConfirmDialogProps = {
    readonly confirmLabel: string;
    readonly description: string;
    readonly isOpen: boolean;
    readonly title: string;
    readonly onCancel: () => void;
    readonly onConfirm: () => void;
};

export const AppConfirmDialog: FC<AppConfirmDialogProps> = ({
    confirmLabel,
    description,
    isOpen,
    onCancel,
    onConfirm,
    title,
}) => (
    <PopupBase
        className="app-confirm-dialog"
        closeOnBackdrop={false}
        isOpen={isOpen}
        label={title}
        onClose={onCancel}
    >
        <div className="popup-content">
            <p className="eyebrow">Please confirm</p>
            <h2>{title}</h2>
            <p>{description}</p>
            <DialogActions>
                <ActionButton onClick={onCancel}>Cancel</ActionButton>
                <ActionButton onClick={onConfirm} variant="danger">
                    {confirmLabel}
                </ActionButton>
            </DialogActions>
        </div>
    </PopupBase>
);
