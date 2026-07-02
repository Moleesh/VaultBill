/** @format */

import type { FC } from 'react';

import { KeyRound } from 'lucide-react';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { ActionButton } from '../../components/ActionButton';
import { AppModal } from '../../components/AppModal/AppModal';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import type { DropdownOption } from '../../components/SearchableDropdown/SearchableDropdown';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { OperatorAccount } from './AccountTypes';

import type { LoginFormApi } from './useLoginForms';

type LoginPageFormProps = {
    readonly capabilities: CapabilityRegistry;
    readonly error: string;
    readonly hostedConnectionState: 'connecting' | 'connected' | 'unavailable';
    readonly isLoginDisabled: boolean;
    readonly isPasswordRequired: boolean;
    readonly isStaticHostedBrowserBuild: boolean;
    readonly showDesktopActions: boolean;
    readonly accountOptions: readonly DropdownOption[];
    readonly form: LoginFormApi;
    readonly selectedAccount: OperatorAccount | undefined;
    readonly selectedAccountId: string;
    readonly onActivationOpen: () => void;
    readonly onHelpOpen: () => void;
    readonly onPasswordChange: (value: string) => void;
    readonly onSelectedAccountIdChange: (value: string) => void;
    readonly onSubmit: () => void;
};

/** Renders the login form, unlock hint, and login help actions. */
export const LoginPageForm: FC<LoginPageFormProps> = ({
    capabilities,
    error,
    hostedConnectionState,
    isLoginDisabled,
    isPasswordRequired,
    isStaticHostedBrowserBuild,
    showDesktopActions,
    accountOptions,
    form,
    selectedAccount,
    selectedAccountId,
    onActivationOpen,
    onHelpOpen,
    onPasswordChange,
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
                <AppModal
                    isDismissible={false}
                    isOpen
                    onClose={() => undefined}
                    title={
                        hostedConnectionState === 'connecting'
                            ? 'Connecting to VaultBill Desktop'
                            : 'VaultBill Desktop is unavailable'
                    }
                >
                    <div className="host-reconnect-modal" role="status">
                        <p>
                            {hostedConnectionState === 'connecting'
                                ? 'Checking the local workspace session. Please wait while VaultBill reconnects.'
                                : 'The hosted browser workspace is waiting for the desktop host to come back. Please wait until the connection is restored.'}
                        </p>
                        <p className="field-note">
                            {hostedConnectionState === 'connecting'
                                ? 'The sign-in screen will continue automatically once the desktop host responds.'
                                : 'Open VaultBill Desktop on the host computer and keep this dialog open.'}
                        </p>
                    </div>
                </AppModal>
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
                        {isStaticHostedBrowserBuild ? (
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
                        {!isStaticHostedBrowserBuild &&
                        (selectedAccount?.passwordHash || selectedAccount?.passwordConfigured) ? (
                            <form.Field name="password">
                                {(field) => (
                                    <FormField.PasswordField
                                        autoComplete="current-password"
                                        invalid={Boolean(error)}
                                        label="Password"
                                        onBlur={field.handleBlur}
                                        onChange={(event) => {
                                            const nextPassword = event.currentTarget.value;
                                            field.handleChange(nextPassword);
                                            onPasswordChange(nextPassword);
                                        }}
                                        requiredIndicator={isPasswordRequired}
                                        required={isPasswordRequired}
                                        value={field.state.value}
                                        wrapperClassName="login-password"
                                    />
                                )}
                            </form.Field>
                        ) : null}
                        {error ? (
                            <p className="feedback-error" role="alert">
                                {error}
                            </p>
                        ) : null}
                        <ActionButton disabled={isLoginDisabled} type="submit" variant="primary">
                            {isStaticHostedBrowserBuild ? 'Start demo' : 'Log in'}
                        </ActionButton>
                    </form>
                </>
            ) : null}
            {shouldShowHelpActions ? (
                <div className="login-help-actions">
                    <ActionButton className="login-help-link" onClick={onHelpOpen}>
                        Sign-in help
                    </ActionButton>
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
