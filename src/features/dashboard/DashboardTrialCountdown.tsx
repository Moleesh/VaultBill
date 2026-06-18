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
    const progress = Math.max(0, Math.min(100, (remainingSeconds / (24 * 60 * 60)) * 100));

    return (
        <article
            className={`dashboard-trial-countdown${isTrialExpired ? ' is-expired' : ''}`}
            aria-label="Trial countdown"
        >
            <div className="dashboard-trial-countdown-copy">
                <small>Trial countdown</small>
                <strong>
                    <span>{countdown.amount}</span>
                    <span>{isTrialExpired ? 'expired' : countdown.label}</span>
                </strong>
            </div>
            <div
                className="dashboard-trial-countdown-bar"
                aria-hidden="true"
                title={isTrialExpired ? 'Expired' : `${countdown.amount} remaining`}
            >
                <span style={{ width: `${String(progress)}%` }} />
            </div>
            <p>
                {isTrialExpired
                    ? 'The trial is now read-only.'
                    : 'Tracked while VaultBill is open, and shown here as remaining session time.'}
            </p>
        </article>
    );
};
