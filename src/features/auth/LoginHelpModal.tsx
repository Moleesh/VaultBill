/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal/AppModal';

type LoginHelpModalProps = {
    readonly isOpen: boolean;
    readonly onClose: () => void;
};

/**
 * Login help copy shown from the sign-in screen.
 */
export const LoginHelpModal: FC<LoginHelpModalProps> = ({ isOpen, onClose }) => (
    <AppModal isOpen={isOpen} onClose={onClose} title="Sign-in help">
        <section className="help-sections">
            <section>
                <h3>Signing in</h3>
                <p>
                    Choose your account, enter a password if one is set, then press Enter or select
                    Log in.
                </p>
                <p>
                    If your account does not have the password you expect, ask your Admin to set or
                    update the password for your account in Settings before you sign in.
                </p>
            </section>
            <section>
                <h3>If an Admin password is forgotten</h3>
                <p>
                    Ask your System Administrator to reset the Admin password, then sign in again
                    with the new password.
                </p>
            </section>
            <section>
                <h3>If another operator password is forgotten</h3>
                <p>
                    Ask your Admin to reset or set the desired password for that operator account in
                    Settings.
                </p>
            </section>
            <section>
                <h3>When the hosted page cannot connect</h3>
                <p>
                    Open VaultBill Desktop on the host computer first, then try reconnecting from
                    the hosted page.
                </p>
            </section>
        </section>
    </AppModal>
);
