/** @format */

import { KeyRound } from 'lucide-react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { CapabilityRegistry } from '../../capability/Capability.types';
import type { DropdownOption } from '../../components/SearchableDropdown/SearchableDropdown';
import type { OperatorAccount } from './AccountTypes';
import type { LoginFormApi } from './useLoginForms';

type LoginPageFormProps = {
    readonly capabilities: CapabilityRegistry;
    readonly error: string;
    readonly hostedConnectionState: 'connecting' | 'connected' | 'unavailable';
    readonly isLoginDisabled: boolean;
    readonly showDesktopActions: boolean;
    readonly accountOptions: readonly DropdownOption[];
    readonly form: LoginFormApi;
    readonly selectedAccount: OperatorAccount | undefined;
    readonly selectedAccountId: string;
    readonly onActivationOpen: () => void;
    readonly onHelpOpen: () => void;
    readonly onSelectedAccountIdChange: (value: string) => void;
    readonly onSubmit: () => void;
};

/** Renders the login form, unlock hint, and login help actions. */
export const LoginPageForm: FC<LoginPageFormProps> = ({
    capabilities,
    error,
    hostedConnectionState,
    isLoginDisabled,
    showDesktopActions,
    accountOptions,
    form,
    selectedAccount,
    selectedAccountId,
    onActivationOpen,
    onHelpOpen,
    onSelectedAccountIdChange,
    onSubmit,
}) => {
    const isHostedDesktopAvailable =
        !capabilities.isHostedWeb || hostedConnectionState === 'connected';
    const shouldShowHelpActions =
        !capabilities.isHostedWeb || hostedConnectionState === 'connected';

    return (
        <>
            {capabilities.isHostedWeb && hostedConnectionState !== 'connected' ? (
                <div className="host-reconnect" role="status">
                    <strong>
                        {hostedConnectionState === 'connecting'
                            ? 'Connecting to VaultBill Desktop'
                            : 'VaultBill Desktop is unavailable'}
                    </strong>
                    <p>
                        {hostedConnectionState === 'connecting'
                            ? 'Checking the local workspace session.'
                            : 'Open VaultBill Desktop on the host computer, then try again.'}
                    </p>
                    {hostedConnectionState === 'unavailable' ? (
                        <ActionButton
                            onClick={() => {
                                window.location.reload();
                            }}
                        >
                            Reconnect
                        </ActionButton>
                    ) : null}
                </div>
            ) : null}
            {isHostedDesktopAvailable ? (
                <>
                    <form
                        className="login-card-auth"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit();
                        }}
                    >
                        {capabilities.isDemoMode ? (
                            <div className="demo-login-summary">
                                <strong>Demo User</strong>
                                <p>Try records, printing, and the guided demo workspace.</p>
                            </div>
                        ) : (
                            <SearchableDropdown
                                label="Operator account"
                                onChange={(value) => {
                                    onSelectedAccountIdChange(value);
                                    form.setFieldValue('selectedAccountId', value);
                                    form.setFieldValue('password', '');
                                }}
                                options={accountOptions}
                                value={selectedAccountId}
                            />
                        )}
                        {!capabilities.isDemoMode &&
                        (selectedAccount?.passwordHash || selectedAccount?.passwordConfigured) ? (
                            <form.Field name="password">
                                {(field) => (
                                    <FormField.TextField
                                        autoComplete="current-password"
                                        label="Password"
                                        onBlur={field.handleBlur}
                                        onChange={(event) => {
                                            field.handleChange(event.currentTarget.value);
                                        }}
                                        type="password"
                                        value={field.state.value}
                                        wrapperClassName="login-password"
                                    />
                                )}
                            </form.Field>
                        ) : null}
                        <ActionButton disabled={isLoginDisabled} type="submit" variant="primary">
                            {capabilities.isDemoMode ? 'Start demo' : 'Log in'}
                        </ActionButton>
                    </form>
                    {error ? (
                        <p className="feedback-error" role="alert">
                            {error}
                        </p>
                    ) : null}
                </>
            ) : null}
            {shouldShowHelpActions ? (
                <div className="login-help-actions">
                    <IconButton className="login-help-link" onClick={onHelpOpen}>
                        Sign-in help
                    </IconButton>
                    {showDesktopActions ? (
                        <IconButton
                            className="login-help-link"
                            icon={<KeyRound aria-hidden="true" size={16} />}
                            onClick={onActivationOpen}
                        >
                            Enter license key
                        </IconButton>
                    ) : null}
                </div>
            ) : null}
        </>
    );
};
