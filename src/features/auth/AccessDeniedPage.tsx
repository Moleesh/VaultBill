/** @format */

import type { FC } from 'react';

import { ActionLink } from '../../components/ActionLink';

export const AccessDeniedPage: FC = () => (
    <main className="standalone-message">
        <p className="eyebrow">Access restricted</p>
        <h1>This page is not available for your operator role.</h1>
        <p>Your access is controlled by VaultBill’s built-in permission rules.</p>
        <ActionLink to="/app/dashboard" variant="primary">
            Return to dashboard
        </ActionLink>
    </main>
);
