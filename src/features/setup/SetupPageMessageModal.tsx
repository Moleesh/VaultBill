/** @format */

import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { FC } from 'react';

type SetupPageMessageModalProps = {
    readonly message: string;
    readonly onClose: () => void;
};

/** Validation messages that should be framed as a gentle nudge instead of a system failure. */
const setupValidationMessages = [
    'Business name and address are required to continue.',
    'Business name is required to continue.',
    'Business address is required to continue.',
    'Admin display name and username are required.',
    'Admin display name is required.',
    'Admin username is required.',
];

/** Shows setup validation and completion issues as a non-blocking toast warning. */
export const SetupPageMessageModal: FC<SetupPageMessageModalProps> = ({ message, onClose }) => {
    const isValidationMessage = setupValidationMessages.includes(message);

    useEffect(() => {
        if (!message) return undefined;
        const timer = window.setTimeout(onClose, isValidationMessage ? 3200 : 4800);
        return () => {
            window.clearTimeout(timer);
        };
    }, [isValidationMessage, message, onClose]);

    if (!message) return null;

    return (
        <aside
            aria-atomic="true"
            aria-live="polite"
            className={`setup-page-toast${isValidationMessage ? ' is-warning' : ' is-error'}`}
            role="alert"
        >
            <div className="setup-page-toast-content">
                <strong className="setup-page-toast-title">
                    {isValidationMessage ? 'Complete required fields' : 'Setup issue'}
                </strong>
                <p>{message}</p>
            </div>
            <button
                aria-label="Dismiss setup message"
                className="setup-page-toast-close"
                onClick={onClose}
                title="Dismiss message"
                type="button"
            >
                <X aria-hidden="true" size={16} />
            </button>
        </aside>
    );
};
