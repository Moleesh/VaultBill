/** @format */

/** Renders a compact dashboard statistic with a label and a value. */

import type { FC } from 'react';

type DashboardMetricProps = {
    readonly label: string;
    readonly value: string;
};

/**
 * Displays a single dashboard metric card so summary sections stay visually
 * consistent across the app.
 */
export const DashboardMetric: FC<DashboardMetricProps> = ({ label, value }) => (
    <article>
        <small>{label}</small>
        <strong>{value}</strong>
    </article>
);
