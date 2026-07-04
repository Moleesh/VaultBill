/** @format */

import type { FC } from 'react';

import { Plus, Trash2, UserRoundCog } from 'lucide-react';

import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { Role } from '../../types/AppTypes';
import {
    canSubmitOperatorCreation,
    securityOperatorRoleOptions,
    type CreateOperatorFormApi,
    type OperatorAccount,
} from './SettingsSecurityAccountsSupport';

type SettingsSecurityOperatorPanelProps = {
    readonly createOperatorForm: CreateOperatorFormApi;
    readonly manageableAccounts: readonly OperatorAccount[];
    readonly onArchiveAccount: (userId: string) => void;
    readonly onSetAccountActive: (account: OperatorAccount, isActive: boolean) => void;
    readonly operatorRole: Role;
};

/** Renders operator creation controls alongside the manageable account list. */
export const SettingsSecurityOperatorPanel: FC<SettingsSecurityOperatorPanelProps> = ({
    createOperatorForm,
    manageableAccounts,
    onArchiveAccount,
    onSetAccountActive,
    operatorRole,
}) => {
    return (
        <div className="settings-subsection">
            <div className="section-heading">
                <div>
                    <h3>Operators</h3>
                    <p>Create and manage the accounts people can use at sign-in.</p>
                </div>
                <UserRoundCog aria-hidden="true" />
            </div>
            <div className="settings-subsection-card settings-subsection-card--form">
                <div className="operator-create operator-create--operators">
                    <div
                        className={`operator-create-fields operator-create-fields--operators${
                            operatorRole === 'SysAdmin' ? ' operator-create-fields--with-role' : ''
                        }`}
                    >
                        <createOperatorForm.Field name="username">
                            {(field) => (
                                <FormField.TextField
                                    label="Username"
                                    onBlur={field.handleBlur}
                                    onChange={(event) => {
                                        field.handleChange(event.currentTarget.value);
                                    }}
                                    required
                                    requiredIndicator
                                    value={field.state.value}
                                />
                            )}
                        </createOperatorForm.Field>
                        <createOperatorForm.Field name="displayName">
                            {(field) => (
                                <FormField.TextField
                                    label="Display name"
                                    onBlur={field.handleBlur}
                                    onChange={(event) => {
                                        field.handleChange(event.currentTarget.value);
                                    }}
                                    required
                                    requiredIndicator
                                    value={field.state.value}
                                />
                            )}
                        </createOperatorForm.Field>
                        <createOperatorForm.Field name="password">
                            {(field) => (
                                <FormField.PasswordField
                                    autoComplete="new-password"
                                    label="Optional password"
                                    onBlur={field.handleBlur}
                                    onChange={(event) => {
                                        field.handleChange(event.currentTarget.value);
                                    }}
                                    placeholder="Leave blank if you want to add it later"
                                    value={field.state.value}
                                />
                            )}
                        </createOperatorForm.Field>
                        {operatorRole === 'SysAdmin' ? (
                            <createOperatorForm.Field name="role">
                                {(field) => (
                                    <SearchableDropdown
                                        label="Role"
                                        onChange={(value) => {
                                            field.handleChange(value as Role);
                                        }}
                                        options={securityOperatorRoleOptions}
                                        value={field.state.value}
                                    />
                                )}
                            </createOperatorForm.Field>
                        ) : null}
                    </div>
                    <div className="operator-create-action">
                        <createOperatorForm.Subscribe
                            selector={(state) => ({
                                displayName: state.values.displayName,
                                password: state.values.password,
                                role: state.values.role,
                                username: state.values.username,
                            })}
                        >
                            {(values) => (
                                <IconButton
                                    disabled={
                                        !canSubmitOperatorCreation({
                                            manageableAccounts,
                                            operatorRole,
                                            values,
                                        })
                                    }
                                    icon={<Plus aria-hidden="true" size={18} />}
                                    onClick={() => {
                                        void createOperatorForm.handleSubmit();
                                    }}
                                    variant="primary"
                                >
                                    Add operator
                                </IconButton>
                            )}
                        </createOperatorForm.Subscribe>
                    </div>
                </div>
            </div>
            <div className="operator-list">
                {manageableAccounts.map((account) => (
                    <article key={account.userId}>
                        <div>
                            <strong>{account.displayName}</strong>
                            <small>
                                {account.username} · {account.role}
                            </small>
                        </div>
                        <FormField.CheckboxField
                            checked={account.isActive}
                            label="Active"
                            onChange={(event) => {
                                onSetAccountActive(account, event.currentTarget.checked);
                            }}
                        />
                        <IconOnlyButton
                            aria-label={`Remove ${account.displayName}`}
                            icon={<Trash2 aria-hidden="true" size={18} />}
                            onClick={() => {
                                onArchiveAccount(account.userId);
                            }}
                        />
                    </article>
                ))}
            </div>
        </div>
    );
};
