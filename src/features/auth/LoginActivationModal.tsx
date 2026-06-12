/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal';

type LoginActivationModalProps = {
    readonly activationMessage: string;
    readonly isOpen: boolean;
    readonly licenseKey: string;
    readonly onActivate: () => void;
    readonly onClose: () => void;
    readonly onLicenseKeyChange: (licenseKey: string) => void;
};

/**
 * Desktop-only activation dialog shown from the sign-in screen.
 */
export const LoginActivationModal: FC<LoginActivationModalProps> = ({
    activationMessage,
    isOpen,
    licenseKey,
    onActivate,
    onClose,
    onLicenseKeyChange,
}) => (
    <AppModal isOpen={isOpen} onClose={onClose} title="Activate VaultBill">
        <label>
            <span>License key</span>
            <input
                value={licenseKey}
                onChange={(event) => {
                    onLicenseKeyChange(event.currentTarget.value);
                }}
            />
        </label>
        {activationMessage ? (
            <p className="feedback-info" role="status">
                {activationMessage}
            </p>
        ) : null}
        <button
            className="button-primary"
            disabled={!licenseKey.trim()}
            onClick={onActivate}
            type="button"
        >
            Activate full version
        </button>
    </AppModal>
);
