/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal/AppModal';

type SetupPageMessageModalProps = {
    readonly message: string;
    readonly onClose: () => void;
};

const setupValidationMessages = new Set([
    'Business name and address are required.',
    'Admin username and display name are required.',
]);

export const SetupPageMessageModal: FC<SetupPageMessageModalProps> = ({ message, onClose }) => (
    <AppModal
        isOpen={message.length > 0}
        onClose={onClose}
        title={setupValidationMessages.has(message) ? 'Complete required fields' : 'Setup issue'}
    >
        <p>{message}</p>
        <div className="popup-actions">
            <span aria-hidden="true" />
            <button className="button-primary" onClick={onClose} type="button">
                Okay
            </button>
        </div>
    </AppModal>
);
