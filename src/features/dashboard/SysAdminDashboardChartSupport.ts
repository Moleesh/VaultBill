/** @format */

import type { SysAdminSummary } from './SysAdminDashboardSupport';

export type SysAdminDashboardChartData = {
    readonly formatHealthTotal: number;
    readonly recordTotal: number;
    readonly userTotal: number;
    readonly formatSegments: readonly {
        readonly label: string;
        readonly value: number;
        readonly className: string;
    }[];
    readonly recordSegments: readonly {
        readonly label: string;
        readonly value: number;
        readonly className: string;
    }[];
    readonly userSegments: readonly {
        readonly label: string;
        readonly value: number;
        readonly className: string;
    }[];
    readonly formatRingBackground: string;
    readonly userRingBackground: string;
};

const formatAngle = (value: number, total: number): string => `${String((value / total) * 360)}deg`;

const chartSegments = <T extends { readonly value: number }>(segments: readonly T[]): T[] =>
    segments.filter((segment) => segment.value > 0);

export const buildSysAdminDashboardChartData = (
    summary: SysAdminSummary,
): SysAdminDashboardChartData => {
    const formatHealthTotal = Math.max(
        summary.formatCount + summary.incompleteFormatCount,
        summary.defaultFormatCount,
        1,
    );
    const recordTotal = Math.max(summary.recordCount, 1);
    const userTotal = Math.max(summary.accountCount, 1);
    const publishedCount = summary.formatCount - summary.incompleteFormatCount;
    const formatSegments = chartSegments([
        {
            label: 'Published',
            value: publishedCount,
            className: 'dashboard-chart__segment--good',
        },
        {
            label: 'Needs attention',
            value: summary.incompleteFormatCount,
            className: 'dashboard-chart__segment--warning',
        },
        {
            label: 'Default',
            value: summary.defaultFormatCount,
            className: 'dashboard-chart__segment--accent',
        },
    ]);
    const recordSegments = chartSegments([
        { label: 'Draft', value: summary.draftCount, className: 'dashboard-chart__segment--muted' },
        {
            label: 'Finalized',
            value: summary.finalizedCount,
            className: 'dashboard-chart__segment--good',
        },
        {
            label: 'Cancelled',
            value: summary.cancelledCount,
            className: 'dashboard-chart__segment--danger',
        },
    ]);
    const userSegments = chartSegments([
        {
            label: 'Active',
            value: summary.activeAccountCount,
            className: 'dashboard-chart__segment--good',
        },
        {
            label: 'Inactive',
            value: summary.accountCount - summary.activeAccountCount,
            className: 'dashboard-chart__segment--muted',
        },
    ]);
    return {
        formatHealthTotal,
        recordTotal,
        userTotal,
        formatSegments,
        recordSegments,
        userSegments,
        formatRingBackground: `conic-gradient(var(--color-primary) 0 ${formatAngle(
            publishedCount,
            formatHealthTotal,
        )}, var(--color-warning) ${formatAngle(publishedCount, formatHealthTotal)} ${formatAngle(
            summary.formatCount,
            formatHealthTotal,
        )}, var(--color-accent) ${formatAngle(summary.formatCount, formatHealthTotal)} 360deg)`,
        userRingBackground: `conic-gradient(var(--color-secondary) 0 ${formatAngle(
            summary.activeAccountCount,
            userTotal,
        )}, var(--color-border) ${formatAngle(summary.activeAccountCount, userTotal)} 360deg)`,
    };
};
