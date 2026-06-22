/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import type { SetupFormApi } from './useSetupForm';

type SetupAdminUserStepProps = {
    readonly form: SetupFormApi;
    readonly showValidation: boolean;
    readonly onFieldTouched: () => void;
};

/** Collects the first Admin account created during first-run setup. */
export const SetupAdminUserStep: FC<SetupAdminUserStepProps> = ({
    form,
    showValidation,
    onFieldTouched,
}) => (
    <div className="form-grid">
        <form.Field name="adminDisplayName">
            {(field) => (
                <FormField.TextField
                    autoFocus
                    invalid={
                        (showValidation || field.state.meta.isTouched) &&
                        field.state.value.trim().length === 0
                    }
                    label="Admin display name"
                    onBlur={() => {
                        field.handleBlur();
                        onFieldTouched();
                    }}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Name people will see in the workspace"
                    required
                    requiredIndicator
                    value={field.state.value}
                />
            )}
        </form.Field>
        <form.Field name="adminUsername">
            {(field) => (
                <FormField.TextField
                    invalid={
                        (showValidation || field.state.meta.isTouched) &&
                        field.state.value.trim().length === 0
                    }
                    label="Admin username"
                    onBlur={() => {
                        field.handleBlur();
                        onFieldTouched();
                    }}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Short name used at sign-in"
                    required
                    requiredIndicator
                    value={field.state.value}
                />
            )}
        </form.Field>
        <form.Field name="adminPassword">
            {(field) => (
                <FormField.TextField
                    autoComplete="new-password"
                    label="Admin password (optional)"
                    note="Leave this blank for now, or add a password before you finish setup."
                    onBlur={() => {
                        field.handleBlur();
                        onFieldTouched();
                    }}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Leave blank if you want to add it later"
                    type="password"
                    value={field.state.value}
                    wrapperClassName="span-2"
                />
            )}
        </form.Field>
    </div>
);
