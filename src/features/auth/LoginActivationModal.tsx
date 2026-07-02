/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { AppModal } from '../../components/AppModal/AppModal';
import { FormField } from '../../components/FormFields';

import type { ActivationFormApi } from './useLoginForms';

type LoginActivationModalProps = {
    readonly activationMessage: string;
    readonly form: ActivationFormApi;
    readonly isOpen: boolean;
    readonly onActivate: () => void;
    readonly onClose: () => void;
};

/**
 * Desktop-only activation dialog shown from the sign-in screen.
 */
export const LoginActivationModal: FC<LoginActivationModalProps> = ({
    activationMessage,
    form,
    isOpen,
    onActivate,
    onClose,
}) => (
    <AppModal isOpen={isOpen} onClose={onClose} title="Activate VaultBill">
        <form.Field name="licenseKey">
            {(field) => (
                <FormField.TextField
                    label="License key"
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    value={field.state.value}
                />
            )}
        </form.Field>
        {activationMessage ? (
            <p className="feedback-info" role="status">
                {activationMessage}
            </p>
        ) : null}
        <ActionButton
            disabled={!form.state.values.licenseKey.trim()}
            onClick={onActivate}
            variant="primary"
        >
            Activate full version
        </ActionButton>
    </AppModal>
);
