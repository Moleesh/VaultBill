/** @format */

import { describe, expect, it, vi } from 'vitest';

import type { OperatorAccount } from '../../auth/AccountTypes';
import {
    activateSecurityLicense,
    changeSecurityPassword,
    createSecurityOperator,
} from '../SettingsSecuritySectionActions';
import type { SettingsActivationFormApi } from '../SettingsSecuritySectionStateSupport';

const createActivationForm = (licenseKey: string): SettingsActivationFormApi =>
    ({
        reset: vi.fn(),
        state: { values: { licenseKey } },
    }) as unknown as SettingsActivationFormApi;

describe('SettingsSecuritySectionActions', () => {
    it('warns before creating an operator without a required identity', async () => {
        const setMessage = vi.fn();
        const saveAccount = vi.fn();

        await createSecurityOperator({
            displayName: '',
            password: '',
            role: 'Admin',
            saveAccount,
            setMessage,
            username: 'admin',
        });

        expect(saveAccount).not.toHaveBeenCalled();
        expect(setMessage).toHaveBeenCalledWith('Enter both a username and a display name.');
    });

    it('creates a passwordless operator with trimmed identity fields', async () => {
        const setMessage = vi.fn();
        const saveAccount = vi.fn(
            (account: OperatorAccount): Promise<OperatorAccount> => Promise.resolve(account),
        );

        await createSecurityOperator({
            displayName: '  Desk Admin  ',
            password: '',
            role: 'Admin',
            saveAccount,
            setMessage,
            username: '  desk  ',
        });

        expect(saveAccount).toHaveBeenCalledWith(
            expect.objectContaining({
                displayName: 'Desk Admin',
                passwordConfigured: false,
                role: 'Admin',
                username: 'desk',
            }),
        );
        expect(setMessage).toHaveBeenCalledWith(
            'Operator added. The admin can start managing users after a password is set.',
        );
    });

    it('requires an account and password before changing credentials', async () => {
        const setMessage = vi.fn();
        const resetPassword = vi.fn();

        await changeSecurityPassword({
            password: '',
            resetPassword,
            setMessage,
            userId: 'admin-1',
        });

        expect(resetPassword).not.toHaveBeenCalled();
        expect(setMessage).toHaveBeenCalledWith('Choose an account and enter a password.');
    });

    it('activates a hosted license and clears the form after success', async () => {
        const activationForm = createActivationForm('  LICENSE-KEY  ');
        const activateHosted = vi.fn().mockResolvedValue(undefined);
        const setMessage = vi.fn();

        activateSecurityLicense({
            activationForm,
            activateDesktop: undefined,
            activateHosted,
            setMessage,
        });
        await vi.waitFor(() => {
            expect(activationForm.reset).toHaveBeenCalledTimes(1);
        });

        expect(activateHosted).toHaveBeenCalledWith('LICENSE-KEY');
        expect(setMessage).toHaveBeenCalledWith('License accepted. Full access is now enabled.');
    });
});
