/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal';

type LoginHelpModalProps = {
    readonly isOpen: boolean;
    readonly onClose: () => void;
};

/**
 * Login help copy shown from the sign-in screen.
 */
export const LoginHelpModal: FC<LoginHelpModalProps> = ({ isOpen, onClose }) => (
    <AppModal isOpen={isOpen} onClose={onClose} title="Login help">
        <p>Choose your account, enter the password if one is set, then press Enter or Log in.</p>
    </AppModal>
);
