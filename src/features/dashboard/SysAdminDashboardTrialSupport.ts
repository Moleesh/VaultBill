/** @format */

import type { TrialCountdownParts } from './SysAdminDashboardSupport';

export const formatTrialCountdownParts = (remainingSeconds: number): TrialCountdownParts => {
    if (remainingSeconds <= 0) return { amount: '0m', label: 'remaining' };
    const totalMinutes = Math.max(1, Math.floor(remainingSeconds / 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
        return { amount: `${String(days)}d ${String(hours)}h`, label: 'remaining' };
    }
    if (hours > 0) {
        return { amount: `${String(hours)}h ${String(minutes)}m`, label: 'remaining' };
    }
    return { amount: `${String(minutes)}m`, label: 'remaining' };
};

export const formatTrialCountdown = (remainingSeconds: number): string => {
    const parts = formatTrialCountdownParts(remainingSeconds);
    return `${parts.amount} ${parts.label}`;
};
