/** @format */

import type { Role } from '../../types/AppTypes';
import type { OperatorAccount } from '../auth/AccountTypes';
import { defaultPasswordHash, hashPassword } from '../auth/SessionSupport';
import { getOperatorCreationMessage } from './SettingsSecuritySectionHelpers';
import type { SettingsActivationFormApi } from './SettingsSecuritySectionStateSupport';

type SaveOperatorAccount = (account: OperatorAccount) => Promise<unknown>;

/** Creates one operator after validating the required account identity fields. */
export const createSecurityOperator = async (input: {
    readonly displayName: string;
    readonly password: string;
    readonly role: Role;
    readonly saveAccount: SaveOperatorAccount;
    readonly setMessage: (message: string) => void;
    readonly username: string;
}): Promise<void> => {
    const username = input.username.trim();
    const displayName = input.displayName.trim();
    if (!username || !displayName) {
        input.setMessage('Enter both a username and a display name.');
        return;
    }
    const optionalPassword = input.password.trim();
    try {
        const passwordHash = optionalPassword ? await hashPassword(optionalPassword) : undefined;
        await input.saveAccount({
            displayName,
            isActive: true,
            passwordConfigured: optionalPassword.length > 0,
            role: input.role,
            userId: crypto.randomUUID(),
            username,
            usesDefaultPassword: passwordHash === defaultPasswordHash,
            ...(passwordHash ? { passwordHash } : {}),
        });
        input.setMessage(getOperatorCreationMessage(input.role));
    } catch (reason) {
        input.setMessage(
            reason instanceof Error ? reason.message : 'Operator could not be created.',
        );
    }
};

/** Changes one selected operator password after minimal required-field validation. */
export const changeSecurityPassword = async (input: {
    readonly password: string;
    readonly resetPassword: (userId: string, password: string) => Promise<unknown>;
    readonly setMessage: (message: string) => void;
    readonly userId: string;
}): Promise<void> => {
    if (!input.userId || !input.password.trim()) {
        input.setMessage('Choose an account and enter a password.');
        return;
    }
    await input.resetPassword(input.userId, input.password);
    input.setMessage('Password saved.');
};

/** Runs the current runtime's license activation flow. */
export const activateSecurityLicense = (input: {
    readonly activationForm: SettingsActivationFormApi;
    readonly activate: (licenseKey: string) => Promise<unknown>;
    readonly setMessage: (message: string) => void;
}): void => {
    const licenseKey = input.activationForm.state.values.licenseKey.trim();
    if (!licenseKey) return;
    void input
        .activate(licenseKey)
        .then(() => {
            input.setMessage('License accepted. Full access is now enabled.');
            input.activationForm.reset();
        })
        .catch((reason: unknown) => {
            input.setMessage(
                reason instanceof Error ? reason.message : 'That license key could not be used.',
            );
        });
};
