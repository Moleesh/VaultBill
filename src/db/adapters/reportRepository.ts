/** @format */

import { z } from 'zod';

import { ReportConfigSchema, type ReportConfig } from '../../engines/reportEngine/ReportTypes';
import { stringifyValidatedJson } from '../startup/JsonParsing';
import type { SqliteConnection } from '../sqlite/SqliteConnection';

export type SaveReportInput = {
    readonly reportId: string;
    readonly reportName: string;
    readonly reportConfig: ReportConfig;
    readonly updatedAt: string;
};

export type StoredReport = {
    readonly reportId: string;
    readonly reportName: string;
    readonly reportConfig: ReportConfig;
    readonly updatedAt: string;
};

const reportRowSchema = z.object({
    report_id: z.string(),
    report_name: z.string(),
    report_json: z.string(),
    updated_at: z.string(),
});

export const saveReport = (connection: SqliteConnection, input: SaveReportInput) => {
    const reportConfig = validateReportConfig(input);
    const existing = connection.get('SELECT report_id FROM reports WHERE report_id = ?;', [
        input.reportId,
    ]);
    const parameters = [
        input.reportName,
        stringifyValidatedJson(reportConfig, ReportConfigSchema),
        input.updatedAt,
        input.reportId,
    ];

    if (existing) {
        connection.run(
            `UPDATE reports
        SET report_name = ?, report_json = ?, updated_at = ?
        WHERE report_id = ?;`,
            parameters,
        );
        return;
    }

    connection.run(
        `INSERT INTO reports
      (report_name, report_json, updated_at, report_id)
      VALUES (?, ?, ?, ?);`,
        parameters,
    );
};

export const loadReport = (
    connection: SqliteConnection,
    reportId: string,
): StoredReport | undefined => {
    const row = connection.get(
        `SELECT report_id, report_name, report_json, updated_at
      FROM reports
      WHERE report_id = ?;`,
        [reportId],
    );

    return row ? parseReportRow(row) : undefined;
};

export const listReports = (connection: SqliteConnection): readonly StoredReport[] =>
    connection
        .all(
            `SELECT report_id, report_name, report_json, updated_at
        FROM reports
        ORDER BY report_name ASC;`,
        )
        .map(parseReportRow);

const validateReportConfig = (input: SaveReportInput): ReportConfig => {
    const parsed = ReportConfigSchema.parse(input.reportConfig);

    if (parsed.ReportId !== input.reportId || parsed.ReportName !== input.reportName) {
        throw new Error('Report metadata must match report JSON.');
    }

    return parsed;
};

const parseReportRow = (row: unknown): StoredReport => {
    const parsed = reportRowSchema.parse(row);
    const reportJson: unknown = JSON.parse(parsed.report_json);

    return {
        reportId: parsed.report_id,
        reportName: parsed.report_name,
        reportConfig: ReportConfigSchema.parse(reportJson),
        updatedAt: parsed.updated_at,
    };
};
