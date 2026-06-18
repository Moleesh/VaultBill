/** @format */

import type { SysAdminSummary } from './SysAdminDashboardSupport';

export type SysAdminDashboardChartData = {
    readonly formatHealthTotal: number;
    readonly recordTotal: number;
    readonly userTotal: number;
    readonly formatSummary: string;
    readonly recordSummary: string;
    readonly userSummary: string;
    readonly backupSummary: string;
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

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${String(count)} ${count === 1 ? singular : plural}`;

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
            className: 'dashboard-chart-segment--good',
        },
        {
            label: 'Needs attention',
            value: summary.incompleteFormatCount,
            className: 'dashboard-chart-segment--warning',
        },
        {
            label: 'Default',
            value: summary.defaultFormatCount,
            className: 'dashboard-chart-segment--accent',
        },
    ]);
    const recordSegments = chartSegments([
        { label: 'Draft', value: summary.draftCount, className: 'dashboard-chart-segment--muted' },
        {
            label: 'Finalized',
            value: summary.finalizedCount,
            className: 'dashboard-chart-segment--good',
        },
        {
            label: 'Cancelled',
            value: summary.cancelledCount,
            className: 'dashboard-chart-segment--danger',
        },
    ]);
    const userSegments = chartSegments([
        {
            label: 'Active',
            value: summary.activeAccountCount,
            className: 'dashboard-chart-segment--good',
        },
        {
            label: 'Inactive',
            value: summary.accountCount - summary.activeAccountCount,
            className: 'dashboard-chart-segment--muted',
        },
    ]);
    return {
        formatHealthTotal,
        recordTotal,
        userTotal,
        formatSummary: `${pluralize(summary.formatCount, 'format')} published, ${pluralize(
            summary.incompleteFormatCount,
            'format',
        )} need attention, ${pluralize(summary.defaultFormatCount, 'format')} marked default.`,
        recordSummary: `${pluralize(summary.recordCount, 'record')} total across ${pluralize(
            summary.draftCount,
            'draft',
        )}, ${pluralize(summary.finalizedCount, 'finalized record', 'finalized records')}, and ${pluralize(
            summary.cancelledCount,
            'cancelled record',
            'cancelled records',
        )}.`,
        userSummary: `${pluralize(summary.activeAccountCount, 'active account')} out of ${pluralize(
            summary.accountCount,
            'operator account',
        )}.`,
        backupSummary: summary.lastBackupAt
            ? `Last backup captured ${summary.lastBackupAt}.`
            : 'No backup has been captured yet.',
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
