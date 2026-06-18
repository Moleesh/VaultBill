/** @format */

import { KeyRound } from 'lucide-react';
import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { CapabilityRegistry } from '../../capability/Capability.types';
import type { DropdownOption } from '../../components/SearchableDropdown/SearchableDropdown';
import type { OperatorAccount } from './AccountTypes';

type LoginPageFormProps = {
    readonly capabilities: CapabilityRegistry;
    readonly error: string;
    readonly hostedConnectionState: 'connecting' | 'connected' | 'unavailable';
    readonly isLoginDisabled: boolean;
    readonly accountOptions: readonly DropdownOption[];
    readonly selectedAccount: OperatorAccount | undefined;
    readonly selectedAccountId: string;
    readonly password: string;
    readonly onActivationOpen: () => void;
    readonly onHelpOpen: () => void;
    readonly onPasswordChange: (value: string) => void;
    readonly onSelectedAccountChange: (value: string) => void;
    readonly onSubmit: () => void;
};

/** Renders the login form, unlock hint, and login help actions. */
export const LoginPageForm: FC<LoginPageFormProps> = ({
    capabilities,
    error,
    hostedConnectionState,
    isLoginDisabled,
    accountOptions,
    selectedAccount,
    selectedAccountId,
    password,
    onActivationOpen,
    onHelpOpen,
    onPasswordChange,
    onSelectedAccountChange,
    onSubmit,
}) => (
    <>
        {capabilities.isLanBrowser && hostedConnectionState !== 'connected' ? (
            <div className="host-reconnect" role="status">
                <strong>
                    {hostedConnectionState === 'connecting'
                        ? 'Connecting to VaultBill Desktop'
                        : 'VaultBill Desktop is unavailable'}
                </strong>
                <p>
                    {hostedConnectionState === 'connecting'
                        ? 'Checking the secure local session.'
                        : 'Open VaultBill Desktop on the host computer, then reconnect.'}
                </p>
                {hostedConnectionState === 'unavailable' ? (
                    <button
                        onClick={() => {
                            window.location.reload();
                        }}
                        type="button"
                    >
                        Reconnect
                    </button>
                ) : null}
            </div>
        ) : null}
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
                    <p>Create invoices, print records, and explore the demo workspace.</p>
                </div>
            ) : (
                <SearchableDropdown
                    label="Operator account"
                    onChange={onSelectedAccountChange}
                    options={accountOptions}
                    value={selectedAccountId}
                />
            )}
            {!capabilities.isDemoMode &&
            (selectedAccount?.passwordHash || selectedAccount?.passwordConfigured) ? (
                <label className="login-password">
                    <span>Password</span>
                    <input
                        autoComplete="current-password"
                        onChange={(event) => {
                            onPasswordChange(event.currentTarget.value);
                        }}
                        type="password"
                        value={password}
                    />
                </label>
            ) : null}
            <button className="button-primary" disabled={isLoginDisabled} type="submit">
                {capabilities.isDemoMode ? 'Start demo' : 'Log in'}
            </button>
        </form>
        {error ? (
            <p className="feedback-error" role="alert">
                {error}
            </p>
        ) : null}
        <button className="login-help-link" onClick={onHelpOpen} type="button">
            Login help
        </button>
        {capabilities.isDesktop ? (
            <button className="login-help-link" onClick={onActivationOpen} type="button">
                <KeyRound aria-hidden="true" size={16} /> Enter license key
            </button>
        ) : null}
    </>
);
