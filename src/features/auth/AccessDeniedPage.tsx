import { Link } from 'react-router-dom';
import type { FC } from 'react';

export const AccessDeniedPage: FC = () => (
  <main className="standalone-message">
    <p className="eyebrow">Access restricted</p>
    <h1>This page is not available for your operator role.</h1>
    <p>Your access is controlled by VaultBill’s built-in permission rules.</p>
    <Link className="button-primary" to="/app/dashboard">
      Return to dashboard
    </Link>
  </main>
);
