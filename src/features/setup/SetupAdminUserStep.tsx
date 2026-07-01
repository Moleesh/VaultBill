/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import { SettingsBusinessThemePicker } from '../settings/SettingsBusinessThemePicker';
import { useSetupPageContext } from './SetupPageContext';

/** Collects the first Admin account created during first-run setup. */
export const SetupAdminUserStep: FC<{
    readonly hasExistingAdminPassword?: boolean;
    readonly selectedTheme: string;
}> = ({ hasExistingAdminPassword = false, selectedTheme }) => {
    const { form, handleThemeChange, showAdminUserValidation } = useSetupPageContext();

    return (
        <div className="form-grid">
            <form.Field name="adminDisplayName">
                {(field) => (
                    <FormField.TextField
                        autoFocus
                        invalid={showAdminUserValidation && field.state.value.trim().length === 0}
                        label="Admin display name"
                        onBlur={field.handleBlur}
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
                        invalid={showAdminUserValidation && field.state.value.trim().length === 0}
                        label="Admin username"
                        onBlur={field.handleBlur}
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
            <SettingsBusinessThemePicker
                note="This theme is used before login and continues into the workspace until someone changes it later in Settings."
                onThemeChange={handleThemeChange}
                theme={selectedTheme}
                wrapperClassName="span-2"
            />
            <form.Field name="adminPassword">
                {(field) => (
                    <FormField.PasswordField
                        autoComplete="new-password"
                        label="Admin password (optional)"
                        note={
                            hasExistingAdminPassword
                                ? 'Current password is kept unless you enter a new one here.'
                                : 'Leave this blank for now, or add a password before you finish setup.'
                        }
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        placeholder={
                            hasExistingAdminPassword
                                ? 'Enter a new password only if you want to replace it'
                                : 'Leave blank if you want to add it later'
                        }
                        value={field.state.value}
                        wrapperClassName="span-2"
                    />
                )}
            </form.Field>
        </div>
    );
};
