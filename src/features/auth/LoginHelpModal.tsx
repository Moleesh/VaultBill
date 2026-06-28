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
                    Some operator accounts start without a password until an Admin adds one in
                    Settings.
                </p>
            </section>
            <section>
                <h3>If an Admin password is forgotten</h3>
                <p>
                    Ask a signed-in Admin to open Settings and set a new password for that account.
                </p>
            </section>
            <section>
                <h3>Open setup again</h3>
                <p>
                    On the sign-in screen, press <strong>F9</strong> and confirm to reopen the
                    initial setup wizard.
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
