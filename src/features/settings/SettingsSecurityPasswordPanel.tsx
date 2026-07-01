/** @format */

import { KeyRound, Plus } from 'lucide-react';
import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { OperatorAccount, PasswordFormApi } from './SettingsSecurityAccountsSupport';

type SettingsSecurityPasswordPanelProps = {
    readonly manageableAccounts: readonly OperatorAccount[];
    readonly passwordForm: PasswordFormApi;
};

/** Renders password management controls for manageable operator accounts. */
export const SettingsSecurityPasswordPanel: FC<SettingsSecurityPasswordPanelProps> = ({
    manageableAccounts,
    passwordForm,
}) => (
    <div className="settings-subsection">
        <div className="section-heading">
            <div>
                <h3>Password</h3>
                <p>Set or replace the password for an account you manage.</p>
            </div>
            <Plus aria-hidden="true" size={18} />
        </div>
        <div className="operator-create">
            <passwordForm.Field name="userId">
                {(field) => (
                    <SearchableDropdown
                        label="Account"
                        onChange={(value) => {
                            field.handleChange(value);
                        }}
                        options={manageableAccounts.map((account) => ({
                            value: account.userId,
                            label: account.displayName,
                        }))}
                        requiredIndicator
                        value={field.state.value}
                    />
                )}
            </passwordForm.Field>
            <passwordForm.Field name="password">
                {(field) => (
                    <FormField.PasswordField
                        label="New password"
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        required
                        requiredIndicator
                        value={field.state.value}
                    />
                )}
            </passwordForm.Field>
            <IconButton
                icon={<KeyRound aria-hidden="true" size={18} />}
                onClick={() => {
                    void passwordForm.handleSubmit();
                }}
            >
                Update password
            </IconButton>
        </div>
    </div>
);
