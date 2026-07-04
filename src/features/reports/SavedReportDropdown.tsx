/** @format */

import type { FC, KeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { useSyncSearchableDropdownMenu } from '../../components/SearchableDropdown/SearchableDropdownStateSupport';
import { normalizeDropdownSearch } from '../../components/SearchableDropdown/SearchableDropdownSupport';
import { SavedReportDropdownMenu } from './SavedReportDropdownMenu';
import { reportSummaryLabel, type SavedReportDefinition } from './SavedReportsSupport';

type SavedReportDropdownProps = {
    readonly canManageReport: (report: SavedReportDefinition) => boolean;
    readonly label: string;
    readonly onCreateReport: () => void;
    readonly onDeleteReport: (reportId: string) => void;
    readonly onEditReport: (report: SavedReportDefinition) => void;
    readonly onSelectReport: (reportId: string) => void;
    readonly savedReports: readonly SavedReportDefinition[];
    readonly selectedSavedReportId: string;
};

const defaultLabel = 'Choose saved report';

export const SavedReportDropdown: FC<SavedReportDropdownProps> = ({
    canManageReport,
    label,
    onCreateReport,
    onDeleteReport,
    onEditReport,
    onSelectReport,
    savedReports,
    selectedSavedReportId,
}) => {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const selectedReport = savedReports.find((report) => report.reportId === selectedSavedReportId);
    const filteredSavedReports = useMemo(() => {
        const normalizedQuery = normalizeDropdownSearch(query);
        return savedReports.filter((report) => {
            const searchText = [report.name, reportSummaryLabel(report)].join(' ');
            return normalizeDropdownSearch(searchText).includes(normalizedQuery);
        });
    }, [query, savedReports]);
    const portalRoot = document.getElementById('portal-root');
    const closeDropdown = () => {
        setIsOpen(false);
        setQuery('');
    };

    useSyncSearchableDropdownMenu({
        isOpen,
        menuRef,
        onClose: closeDropdown,
        triggerRef,
    });

    const triggerLabel =
        selectedReport === undefined
            ? defaultLabel
            : `${selectedReport.name} - ${reportSummaryLabel(selectedReport)}`;

    const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape') return;
        closeDropdown();
        triggerRef.current?.focus();
    };

    return (
        <FormField.Wrapper label={label}>
            <div className="saved-report-dropdown">
                <ActionButton
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-label={`${label} ${triggerLabel}`}
                    className="searchable-dropdown-trigger"
                    onClick={() => {
                        setIsOpen((current) => !current);
                    }}
                    ref={triggerRef}
                >
                    <span id={`${id}-value`}>{triggerLabel}</span>
                    <span aria-hidden="true" className="searchable-dropdown-caret">
                        ▾
                    </span>
                </ActionButton>
                {isOpen && portalRoot
                    ? createPortal(
                          <SavedReportDropdownMenu
                              canManageReport={canManageReport}
                              label={label}
                              menuRef={menuRef}
                              onCreateReport={() => {
                                  closeDropdown();
                                  onCreateReport();
                              }}
                              onDeleteReport={(reportId) => {
                                  closeDropdown();
                                  onDeleteReport(reportId);
                              }}
                              onEditReport={(report) => {
                                  closeDropdown();
                                  onEditReport(report);
                              }}
                              onMenuKeyDown={handleMenuKeyDown}
                              onMouseDown={(event) => {
                                  event.stopPropagation();
                              }}
                              onQueryChange={setQuery}
                              onSelectReport={(reportId) => {
                                  onSelectReport(reportId);
                                  closeDropdown();
                              }}
                              query={query}
                              savedReports={filteredSavedReports}
                              selectedSavedReportId={selectedSavedReportId}
                          />,
                          portalRoot,
                      )
                    : null}
            </div>
        </FormField.Wrapper>
    );
};
