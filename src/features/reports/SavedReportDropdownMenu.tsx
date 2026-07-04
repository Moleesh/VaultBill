/** @format */

import type { KeyboardEventHandler, MouseEventHandler, RefObject } from 'react';

import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { reportSummaryLabel, type SavedReportDefinition } from './SavedReportsSupport';

type SavedReportDropdownMenuProps = {
    readonly canManageReport: (report: SavedReportDefinition) => boolean;
    readonly label: string;
    readonly menuRef: RefObject<HTMLDivElement | null>;
    readonly onCreateReport: () => void;
    readonly onDeleteReport: (reportId: string) => void;
    readonly onEditReport: (report: SavedReportDefinition) => void;
    readonly onMenuKeyDown: KeyboardEventHandler<HTMLDivElement>;
    readonly onMouseDown: MouseEventHandler<HTMLDivElement>;
    readonly onQueryChange: (value: string) => void;
    readonly onSelectReport: (reportId: string) => void;
    readonly query: string;
    readonly savedReports: readonly SavedReportDefinition[];
    readonly selectedSavedReportId: string;
};

const defaultLabel = 'Choose saved report';

export const SavedReportDropdownMenu = ({
    canManageReport,
    label,
    menuRef,
    onCreateReport,
    onDeleteReport,
    onEditReport,
    onMenuKeyDown,
    onMouseDown,
    onQueryChange,
    onSelectReport,
    query,
    savedReports,
    selectedSavedReportId,
}: SavedReportDropdownMenuProps) => (
    <div
        className="searchable-dropdown-menu saved-report-dropdown-menu"
        onKeyDown={onMenuKeyDown}
        onMouseDown={onMouseDown}
        ref={menuRef}
    >
        <div className="saved-report-dropdown-toolbar">
            <FormField.TextField
                autoFocus
                hideLabel
                label={`Search ${label}`}
                onChange={(event) => {
                    onQueryChange(event.currentTarget.value);
                }}
                placeholder="Search saved reports"
                trailingAdornment={<Search aria-hidden="true" size={16} />}
                value={query}
                wrapperClassName="searchable-dropdown-search saved-report-dropdown-search"
            />
            <IconButton
                aria-label="Create report"
                icon={<Plus aria-hidden="true" size={16} />}
                onClick={onCreateReport}
                variant="primary"
            >
                Add
            </IconButton>
        </div>
        <div role="listbox">
            <ActionButton
                aria-selected={selectedSavedReportId === ''}
                className="saved-report-dropdown-option"
                onClick={() => {
                    onSelectReport('');
                }}
                role="option"
            >
                <strong>{defaultLabel}</strong>
            </ActionButton>
            {savedReports.length === 0 ? (
                <p className="searchable-dropdown-empty">No matching saved reports.</p>
            ) : (
                savedReports.map((report) => {
                    const canManage = canManageReport(report);
                    return (
                        <div className="saved-report-dropdown-row" key={report.reportId}>
                            <ActionButton
                                aria-selected={report.reportId === selectedSavedReportId}
                                className="saved-report-dropdown-option"
                                onClick={() => {
                                    onSelectReport(report.reportId);
                                }}
                                role="option"
                            >
                                <strong>
                                    {report.reportId === selectedSavedReportId ? (
                                        <span aria-hidden="true">✓ </span>
                                    ) : null}
                                    {report.name}
                                </strong>
                                <small>{reportSummaryLabel(report)}</small>
                            </ActionButton>
                            <div className="saved-report-dropdown-actions">
                                {!report.isBuiltIn ? (
                                    <IconButton
                                        aria-label={`Edit ${report.name}`}
                                        disabled={!canManage}
                                        icon={<Pencil aria-hidden="true" size={14} />}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onEditReport(report);
                                        }}
                                        title={`Edit ${report.name}`}
                                    >
                                        Edit
                                    </IconButton>
                                ) : null}
                                {!report.isBuiltIn ? (
                                    <IconButton
                                        aria-label={`Delete ${report.name}`}
                                        disabled={!canManage}
                                        icon={<Trash2 aria-hidden="true" size={14} />}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onDeleteReport(report.reportId);
                                        }}
                                        title={`Delete ${report.name}`}
                                        variant="secondary"
                                    >
                                        Delete
                                    </IconButton>
                                ) : null}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
);
