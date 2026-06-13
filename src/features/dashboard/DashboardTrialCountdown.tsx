/** @format */

import type { FC } from 'react';

import { formatTrialCountdownParts } from './SysAdminDashboardTrialSupport';

type DashboardTrialCountdownProps = {
    readonly remainingSeconds: number;
    readonly isTrialExpired: boolean;
    readonly isFullVersion: boolean;
};

/**
 * Presents the accumulated-use trial as a compact, single-purpose counter card.
 */
export const DashboardTrialCountdown: FC<DashboardTrialCountdownProps> = ({
    remainingSeconds,
    isTrialExpired,
    isFullVersion,
}) => {
    if (isFullVersion) return null;

    const countdown = formatTrialCountdownParts(remainingSeconds);

    return (
        <article className={`dashboard-trial-countdown${isTrialExpired ? ' is-expired' : ''}`}>
            <small>Trial countdown</small>
            <strong>
                <span>{countdown.amount}</span>
                <span>{isTrialExpired ? 'expired' : countdown.label}</span>
            </strong>
            <p>
                {isTrialExpired
                    ? 'The trial is now read-only.'
                    : 'Accumulated while VaultBill is open.'}
            </p>
        </article>
    );
};
