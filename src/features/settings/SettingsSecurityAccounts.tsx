/** @format */

import { Plus, Trash2, UserRoundCog } from 'lucide-react';
import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { Role } from '../../types/AppTypes';

type OperatorAccount = {
    readonly userId: string;
    readonly username: string;
    readonly displayName: string;
    readonly role: Role;
    readonly isActive: boolean;
};

type SettingsSecurityAccountsProps = {
    readonly operatorRole: Role;
    readonly manageableAccounts: readonly OperatorAccount[];
    readonly newUsername: string;
    readonly newDisplayName: string;
    readonly newRole: Role;
    readonly passwordUserId: string;
    readonly newPassword: string;
    readonly onNewUsernameChange: (value: string) => void;
    readonly onNewDisplayNameChange: (value: string) => void;
    readonly onNewRoleChange: (value: Role) => void;
    readonly onPasswordUserIdChange: (value: string) => void;
    readonly onNewPasswordChange: (value: string) => void;
    readonly onCreateOperator: () => Promise<void> | void;
    readonly onChangePassword: () => void;
    readonly onArchiveAccount: (userId: string) => void;
    readonly onSetAccountActive: (account: OperatorAccount, isActive: boolean) => void;
    readonly canCreateOperator: boolean;
};

/** Renders operator creation and password management controls. */
export const SettingsSecurityAccounts: FC<SettingsSecurityAccountsProps> = ({
    operatorRole,
    manageableAccounts,
    newUsername,
    newDisplayName,
    newRole,
    passwordUserId,
    newPassword,
    onNewUsernameChange,
    onNewDisplayNameChange,
    onNewRoleChange,
    onPasswordUserIdChange,
    onNewPasswordChange,
    onCreateOperator,
    onChangePassword,
    onArchiveAccount,
    onSetAccountActive,
    canCreateOperator,
}) => (
    <>
        <div className="settings-subsection">
            <div className="section-heading">
                <div>
                    <h3>Operators</h3>
                    <p>Create and maintain the accounts available at login.</p>
                </div>
                <UserRoundCog aria-hidden="true" />
            </div>
            <div className="operator-create">
                <label>
                    <span>Username</span>
                    <input
                        value={newUsername}
                        onChange={(event) => {
                            onNewUsernameChange(event.currentTarget.value);
                        }}
                    />
                </label>
                <label>
                    <span>Display name</span>
                    <input
                        value={newDisplayName}
                        onChange={(event) => {
                            onNewDisplayNameChange(event.currentTarget.value);
                        }}
                    />
                </label>
                {operatorRole === 'SysAdmin' ? (
                    <SearchableDropdown
                        label="Role"
                        onChange={(value) => {
                            onNewRoleChange(value as Role);
                        }}
                        options={[
                            { value: 'Admin', label: 'Admin' },
                            { value: 'User', label: 'User' },
                        ]}
                        value={newRole}
                    />
                ) : null}
                <button
                    className="button-primary"
                    disabled={!canCreateOperator}
                    onClick={() => {
                        void onCreateOperator();
                    }}
                    type="button"
                >
                    <Plus aria-hidden="true" size={18} /> Add operator
                </button>
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
                        <label className="checkbox-field">
                            <input
                                checked={account.isActive}
                                onChange={(event) => {
                                    onSetAccountActive(account, event.currentTarget.checked);
                                }}
                                type="checkbox"
                            />
                            <span>Active</span>
                        </label>
                        <button
                            aria-label={`Remove ${account.displayName}`}
                            onClick={() => {
                                onArchiveAccount(account.userId);
                            }}
                            type="button"
                        >
                            <Trash2 aria-hidden="true" size={18} />
                        </button>
                    </article>
                ))}
            </div>
        </div>
        <div className="settings-subsection">
            <div className="section-heading">
                <div>
                    <h3>Password</h3>
                    <p>Set a final password for an account you may manage.</p>
                </div>
                <Plus aria-hidden="true" size={18} />
            </div>
            <div className="operator-create">
                <SearchableDropdown
                    label="Account"
                    onChange={onPasswordUserIdChange}
                    options={manageableAccounts.map((account) => ({
                        value: account.userId,
                        label: account.displayName,
                    }))}
                    value={passwordUserId}
                />
                <label>
                    <span>New password</span>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => {
                            onNewPasswordChange(event.currentTarget.value);
                        }}
                    />
                </label>
                <button onClick={onChangePassword} type="button">
                    Update password
                </button>
            </div>
        </div>
    </>
);
