/** @format */

import type { DragEvent, FC } from 'react';
import { useState } from 'react';

import { GripVertical, Plus } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { AppModal } from '../../components/AppModal/AppModal';
import { DialogActions } from '../../components/DialogActions';
import { DragHandleButton } from '../../components/DragHandleButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { ReportFieldValueControl } from './ReportsFilterPanelSupport';
import { defaultDisplayFieldsForReport, reportDisplayFieldOptionsFor } from './ReportsPageColumns';
import { createReportFilter } from './ReportsPageFilterSupport';
import { reportFieldOptions } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';
import { SavedReportDropdown } from './SavedReportDropdown';
import {
    defaultSorts,
    operatorOptionsForReportField,
    type SavedReportEditorInput,
    type SavedReportDefinition,
} from './SavedReportsSupport';

import type { ReportsFilterFormApi } from './useReportsPageFilters';

type ReportsFilterPanelProps = {
    readonly form: ReportsFilterFormApi;
    readonly formatOptions: readonly {
        readonly value: string;
        readonly label: string;
        readonly description?: string;
    }[];
    readonly reportFilters: readonly ReportFieldFilter[];
    readonly canManageReport: (report: SavedReportDefinition) => boolean;
    readonly onUpdateFilter: (id: string, next: Partial<ReportFieldFilter>) => void;
    readonly customers: readonly string[];
    readonly savedReports: readonly SavedReportDefinition[];
    readonly selectedSavedReportId: string;
    readonly onSelectSavedReport: (reportId: string) => void;
    readonly onSaveReport: (input: SavedReportEditorInput) => void;
    readonly onDeleteSavedReportById: (reportId: string) => void;
    readonly isDynamicPromptOpen: boolean;
    readonly onCloseDynamicPrompt: () => void;
};

type ReportSortDirection = 'asc' | 'desc';

type ReportSortRule = {
    readonly id: string;
    readonly direction: ReportSortDirection;
    readonly field: string;
};

const moveItem = <T,>(items: readonly T[], from: number, to: number): readonly T[] => {
    if (from === to) return items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    if (item !== undefined) next.splice(to, 0, item);
    return next;
};

const createSortRule = (field = 'updatedAt', direction: ReportSortDirection = 'desc') => ({
    id: globalThis.crypto.randomUUID(),
    field,
    direction,
});

const parseSavedSorts = (sorts: readonly string[]): readonly ReportSortRule[] =>
    sorts.length > 0
        ? sorts.map((sort) => {
              const [field = 'updatedAt', direction = 'desc'] = sort.split(':');
              return createSortRule(
                  field,
                  direction === 'asc' || direction === 'desc' ? direction : 'desc',
              );
          })
        : [createSortRule()];

const serializeSavedSorts = (sorts: readonly ReportSortRule[]): readonly string[] =>
    sorts.filter((sort) => sort.field.trim()).map((sort) => `${sort.field}:${sort.direction}`);

export const ReportsFilterPanel: FC<ReportsFilterPanelProps> = ({
    form,
    formatOptions,
    reportFilters,
    canManageReport,
    onUpdateFilter,
    customers,
    savedReports,
    selectedSavedReportId,
    onSelectSavedReport,
    onSaveReport,
    onDeleteSavedReportById,
    isDynamicPromptOpen,
    onCloseDynamicPrompt,
}) => {
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create');
    const [reportName, setReportName] = useState('');
    const [wizardDisplayFields, setWizardDisplayFields] = useState<readonly string[]>(
        defaultDisplayFieldsForReport('sales-register'),
    );
    const [wizardFilters, setWizardFilters] = useState<readonly ReportFieldFilter[]>([
        createReportFilter(),
    ]);
    const [wizardSorts, setWizardSorts] = useState<readonly ReportSortRule[]>(
        parseSavedSorts(defaultSorts),
    );
    const [draggedDisplayFieldIndex, setDraggedDisplayFieldIndex] = useState<number | undefined>();
    const [draggedFilterIndex, setDraggedFilterIndex] = useState<number | undefined>();
    const [draggedSortIndex, setDraggedSortIndex] = useState<number | undefined>();
    const selectedSavedReport = savedReports.find(
        (report) => report.reportId === selectedSavedReportId,
    );
    const wizardFormatId =
        wizardMode === 'edit'
            ? (selectedSavedReport?.formatId ?? form.state.values.formatId)
            : form.state.values.formatId;
    const wizardDisplayFieldOptions = reportDisplayFieldOptionsFor(wizardFormatId);
    const promptFilters = reportFilters.filter((filter) => filter.promptAtRun);
    const activeFormatLabel =
        formatOptions.find((option) => option.value === form.state.values.formatId)?.label ??
        form.state.values.formatId;
    const selectedReportLabel = selectedSavedReport?.name ?? 'Custom filters';
    const openWizard = (mode: 'create' | 'edit', reportOverride?: SavedReportDefinition) => {
        const targetReport = reportOverride ?? selectedSavedReport;
        setWizardMode(mode);
        setReportName(mode === 'edit' ? (targetReport?.name ?? '') : '');
        setWizardDisplayFields(
            mode === 'edit'
                ? targetReport?.displayFields.length
                    ? targetReport.displayFields
                    : defaultDisplayFieldsForReport(
                          targetReport?.formatId ?? form.state.values.formatId,
                      )
                : defaultDisplayFieldsForReport(form.state.values.formatId),
        );
        setWizardSorts(
            parseSavedSorts(
                mode === 'edit'
                    ? targetReport?.sorts.length
                        ? targetReport.sorts
                        : defaultSorts
                    : defaultSorts,
            ),
        );
        setWizardFilters(
            mode === 'edit'
                ? targetReport?.filters.length
                    ? targetReport.filters.map((filter) => ({ ...filter }))
                    : [createReportFilter()]
                : reportFilters.some((filter) => filter.field || filter.value.trim())
                  ? reportFilters.map((filter) => ({ ...filter }))
                  : [createReportFilter()],
        );
        setIsWizardOpen(true);
    };
    const handleReorderDrop = (
        event: DragEvent<HTMLElement>,
        from: number | undefined,
        to: number,
        onMove: (fromIndex: number, toIndex: number) => void,
        clearDrag: () => void,
    ) => {
        event.preventDefault();
        clearDrag();
        if (from === undefined) return;
        onMove(from, to);
    };

    return (
        <>
            <div className="page-hero page-hero--compact reports-hero">
                <div className="page-section-intro">
                    <p className="eyebrow">Reports workspace</p>
                    <h1>{activeFormatLabel}</h1>
                    <p>
                        Run saved views fast, or build a focused report with reusable filters and
                        presets.
                    </p>
                    <div className="reports-hero-meta">
                        <span>{`${String(savedReports.length)} saved reports ready`}</span>
                        <span>{`Active view: ${selectedReportLabel}`}</span>
                    </div>
                </div>
            </div>
            <section className="data-panel">
                <div className="report-filter-toolbar">
                    <form.Field name="formatId">
                        {(field) => (
                            <SearchableDropdown
                                label="Format"
                                onChange={(value) => {
                                    field.handleChange(value);
                                }}
                                options={formatOptions.map((option) => ({ ...option }))}
                                value={field.state.value}
                            />
                        )}
                    </form.Field>
                    <SavedReportDropdown
                        canManageReport={canManageReport}
                        label="Saved report"
                        onCreateReport={() => {
                            openWizard('create');
                        }}
                        onDeleteReport={onDeleteSavedReportById}
                        onEditReport={(report) => {
                            onSelectSavedReport(report.reportId);
                            openWizard('edit', report);
                        }}
                        onSelectReport={onSelectSavedReport}
                        savedReports={savedReports}
                        selectedSavedReportId={selectedSavedReportId}
                    />
                </div>
            </section>
            <AppModal
                isOpen={isWizardOpen}
                onClose={() => {
                    setIsWizardOpen(false);
                }}
                title={wizardMode === 'edit' ? 'Edit report' : 'Create report'}
            >
                <FormField.TextField
                    label="Report name"
                    onChange={(event) => {
                        setReportName(event.currentTarget.value);
                    }}
                    required
                    requiredIndicator
                    value={reportName}
                />
                <div className="report-wizard-sections">
                    <section className="report-wizard-section">
                        <div className="section-heading">
                            <div>
                                <h3>Display fields</h3>
                                <p>Choose the columns operators should see first.</p>
                            </div>
                            <IconButton
                                icon={<Plus aria-hidden="true" size={16} />}
                                onClick={() => {
                                    setWizardDisplayFields((current) => [...current, '']);
                                }}
                            >
                                Add field
                            </IconButton>
                        </div>
                        <div className="report-wizard-list">
                            {wizardDisplayFields.map((field, index) => (
                                <article
                                    data-cursor-drag="true"
                                    draggable
                                    key={`display-${String(index)}-${field}`}
                                    onDragEnd={() => {
                                        setDraggedDisplayFieldIndex(undefined);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                    }}
                                    onDragStart={(event) => {
                                        setDraggedDisplayFieldIndex(index);
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', field);
                                    }}
                                    onDrop={(event) => {
                                        handleReorderDrop(
                                            event,
                                            draggedDisplayFieldIndex,
                                            index,
                                            (from, to) => {
                                                setWizardDisplayFields((current) =>
                                                    moveItem(current, from, to),
                                                );
                                            },
                                            () => {
                                                setDraggedDisplayFieldIndex(undefined);
                                            },
                                        );
                                    }}
                                >
                                    <DragHandleButton
                                        aria-label={`Drag display field ${String(index + 1)}`}
                                        icon={<GripVertical aria-hidden="true" size={16} />}
                                        onClick={(event) => {
                                            event.preventDefault();
                                        }}
                                        tabIndex={-1}
                                    />
                                    <SearchableDropdown
                                        label={`Display field ${String(index + 1)}`}
                                        onChange={(value) => {
                                            setWizardDisplayFields((current) =>
                                                current.map((entry, entryIndex) =>
                                                    entryIndex === index ? value : entry,
                                                ),
                                            );
                                        }}
                                        options={wizardDisplayFieldOptions.map((option) => ({
                                            ...option,
                                        }))}
                                        value={field}
                                    />
                                    <ActionButton
                                        disabled={wizardDisplayFields.length === 1}
                                        onClick={() => {
                                            setWizardDisplayFields((current) =>
                                                current.filter(
                                                    (_, entryIndex) => entryIndex !== index,
                                                ),
                                            );
                                        }}
                                    >
                                        Remove
                                    </ActionButton>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section className="report-wizard-section">
                        <div className="section-heading">
                            <div>
                                <h3>Sorting</h3>
                                <p>Set the order in which matching records should appear.</p>
                            </div>
                            <IconButton
                                icon={<Plus aria-hidden="true" size={16} />}
                                onClick={() => {
                                    setWizardSorts((current) => [...current, createSortRule()]);
                                }}
                            >
                                Add sort
                            </IconButton>
                        </div>
                        <div className="report-wizard-list">
                            {wizardSorts.map((sort, index) => (
                                <article
                                    data-cursor-drag="true"
                                    draggable
                                    key={sort.id}
                                    onDragEnd={() => {
                                        setDraggedSortIndex(undefined);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                    }}
                                    onDragStart={(event) => {
                                        setDraggedSortIndex(index);
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', sort.id);
                                    }}
                                    onDrop={(event) => {
                                        handleReorderDrop(
                                            event,
                                            draggedSortIndex,
                                            index,
                                            (from, to) => {
                                                setWizardSorts((current) =>
                                                    moveItem(current, from, to),
                                                );
                                            },
                                            () => {
                                                setDraggedSortIndex(undefined);
                                            },
                                        );
                                    }}
                                >
                                    <DragHandleButton
                                        aria-label={`Drag sort ${String(index + 1)}`}
                                        icon={<GripVertical aria-hidden="true" size={16} />}
                                        onClick={(event) => {
                                            event.preventDefault();
                                        }}
                                        tabIndex={-1}
                                    />
                                    <SearchableDropdown
                                        label={`Sort field ${String(index + 1)}`}
                                        onChange={(value) => {
                                            setWizardSorts((current) =>
                                                current.map((entry) =>
                                                    entry.id === sort.id
                                                        ? { ...entry, field: value }
                                                        : entry,
                                                ),
                                            );
                                        }}
                                        options={reportFieldOptions.map((option) => ({
                                            ...option,
                                        }))}
                                        value={sort.field}
                                    />
                                    <SearchableDropdown
                                        label="Direction"
                                        onChange={(value) => {
                                            if (value !== 'asc' && value !== 'desc') return;
                                            setWizardSorts((current) =>
                                                current.map((entry) =>
                                                    entry.id === sort.id
                                                        ? { ...entry, direction: value }
                                                        : entry,
                                                ),
                                            );
                                        }}
                                        options={[
                                            { value: 'desc', label: 'Descending' },
                                            { value: 'asc', label: 'Ascending' },
                                        ]}
                                        value={sort.direction}
                                    />
                                    <ActionButton
                                        disabled={wizardSorts.length === 1}
                                        onClick={() => {
                                            setWizardSorts((current) =>
                                                current.filter((entry) => entry.id !== sort.id),
                                            );
                                        }}
                                    >
                                        Remove
                                    </ActionButton>
                                </article>
                            ))}
                        </div>
                    </section>
                    <section className="report-wizard-section">
                        <div className="section-heading">
                            <div>
                                <h3>Filters</h3>
                                <p>
                                    Reuse up to five filters and choose which ones prompt at run
                                    time.
                                </p>
                            </div>
                            <IconButton
                                disabled={wizardFilters.length >= 5}
                                icon={<Plus aria-hidden="true" size={16} />}
                                onClick={() => {
                                    setWizardFilters((current) =>
                                        current.length >= 5
                                            ? current
                                            : [...current, createReportFilter()],
                                    );
                                }}
                            >
                                Add filter
                            </IconButton>
                        </div>
                        <div className="report-wizard-list report-wizard-list--filters">
                            {wizardFilters.map((filter, index) => (
                                <article
                                    data-cursor-drag="true"
                                    draggable
                                    key={filter.id}
                                    onDragEnd={() => {
                                        setDraggedFilterIndex(undefined);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                    }}
                                    onDragStart={(event) => {
                                        setDraggedFilterIndex(index);
                                        event.dataTransfer.effectAllowed = 'move';
                                        event.dataTransfer.setData('text/plain', filter.id);
                                    }}
                                    onDrop={(event) => {
                                        handleReorderDrop(
                                            event,
                                            draggedFilterIndex,
                                            index,
                                            (from, to) => {
                                                setWizardFilters((current) =>
                                                    moveItem(current, from, to),
                                                );
                                            },
                                            () => {
                                                setDraggedFilterIndex(undefined);
                                            },
                                        );
                                    }}
                                >
                                    <DragHandleButton
                                        aria-label={`Drag filter ${String(index + 1)}`}
                                        icon={<GripVertical aria-hidden="true" size={16} />}
                                        onClick={(event) => {
                                            event.preventDefault();
                                        }}
                                        tabIndex={-1}
                                    />
                                    <div className="report-filter-row">
                                        <SearchableDropdown
                                            label={`Filter field ${String(index + 1)}`}
                                            onChange={(value) => {
                                                setWizardFilters((current) =>
                                                    current.map((entry) =>
                                                        entry.id === filter.id
                                                            ? {
                                                                  ...entry,
                                                                  field: value,
                                                                  operator:
                                                                      operatorOptionsForReportField(
                                                                          value,
                                                                      )[0]?.value ?? 'contains',
                                                                  value: '',
                                                                  valueEnd: '',
                                                              }
                                                            : entry,
                                                    ),
                                                );
                                            }}
                                            options={reportFieldOptions.map((option) => ({
                                                ...option,
                                            }))}
                                            value={filter.field}
                                        />
                                        <SearchableDropdown
                                            label="Operator"
                                            onChange={(value) => {
                                                setWizardFilters((current) =>
                                                    current.map((entry) =>
                                                        entry.id === filter.id
                                                            ? { ...entry, operator: value }
                                                            : entry,
                                                    ),
                                                );
                                            }}
                                            options={operatorOptionsForReportField(
                                                filter.field,
                                            ).map((option) => ({ ...option }))}
                                            value={
                                                operatorOptionsForReportField(filter.field).some(
                                                    (option) => option.value === filter.operator,
                                                )
                                                    ? (filter.operator ?? 'contains')
                                                    : (operatorOptionsForReportField(
                                                          filter.field,
                                                      )[0]?.value ?? 'contains')
                                            }
                                        />
                                        <div className="report-filter-row-value">
                                            {filter.operator === 'is-empty' ||
                                            filter.operator === 'is-not-empty' ? null : (
                                                <ReportFieldValueControl
                                                    customers={customers}
                                                    filter={filter}
                                                    onUpdateFilter={(id, next) => {
                                                        setWizardFilters((current) =>
                                                            current.map((entry) =>
                                                                entry.id === id
                                                                    ? { ...entry, ...next }
                                                                    : entry,
                                                            ),
                                                        );
                                                    }}
                                                />
                                            )}
                                            {filter.operator === 'between' ? (
                                                <FormField.TextField
                                                    label="To value"
                                                    onChange={(event) => {
                                                        setWizardFilters((current) =>
                                                            current.map((entry) =>
                                                                entry.id === filter.id
                                                                    ? {
                                                                          ...entry,
                                                                          valueEnd:
                                                                              event.currentTarget
                                                                                  .value,
                                                                      }
                                                                    : entry,
                                                            ),
                                                        );
                                                    }}
                                                    value={filter.valueEnd ?? ''}
                                                />
                                            ) : null}
                                            {filter.field ? (
                                                <div className="report-filter-options">
                                                    <FormField.CheckboxField
                                                        checked={filter.caseInsensitive !== false}
                                                        label="Case-insensitive"
                                                        onChange={(event) => {
                                                            setWizardFilters((current) =>
                                                                current.map((entry) =>
                                                                    entry.id === filter.id
                                                                        ? {
                                                                              ...entry,
                                                                              caseInsensitive:
                                                                                  event
                                                                                      .currentTarget
                                                                                      .checked,
                                                                          }
                                                                        : entry,
                                                                ),
                                                            );
                                                        }}
                                                    />
                                                    <FormField.CheckboxField
                                                        checked={filter.promptAtRun === true}
                                                        label="Ask when running"
                                                        onChange={(event) => {
                                                            setWizardFilters((current) =>
                                                                current.map((entry) =>
                                                                    entry.id === filter.id
                                                                        ? {
                                                                              ...entry,
                                                                              promptAtRun:
                                                                                  event
                                                                                      .currentTarget
                                                                                      .checked,
                                                                          }
                                                                        : entry,
                                                                ),
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="report-filter-row-actions">
                                            <ActionButton
                                                disabled={wizardFilters.length === 1}
                                                onClick={() => {
                                                    setWizardFilters((current) =>
                                                        current.filter(
                                                            (entry) => entry.id !== filter.id,
                                                        ),
                                                    );
                                                }}
                                            >
                                                Remove
                                            </ActionButton>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
                <DialogActions>
                    <ActionButton
                        onClick={() => {
                            setIsWizardOpen(false);
                        }}
                    >
                        Cancel
                    </ActionButton>
                    <ActionButton
                        disabled={
                            !reportName.trim() ||
                            !wizardDisplayFields.some((field) => field.trim()) ||
                            !wizardSorts.some((sort) => sort.field.trim())
                        }
                        onClick={() => {
                            onSaveReport({
                                name: reportName.trim(),
                                formatId: form.state.values.formatId,
                                ...(wizardMode === 'edit'
                                    ? { reportId: selectedSavedReportId }
                                    : {}),
                                displayFields: wizardDisplayFields.filter((field) => field.trim()),
                                sorts: serializeSavedSorts(wizardSorts),
                                filters: wizardFilters.filter(
                                    (filter) =>
                                        filter.field &&
                                        (filter.value.trim() ||
                                            filter.operator === 'is-empty' ||
                                            filter.operator === 'is-not-empty' ||
                                            filter.promptAtRun),
                                ),
                                preset: form.state.values.preset,
                                status: form.state.values.status,
                            });
                            setIsWizardOpen(false);
                        }}
                        variant="primary"
                    >
                        Save report
                    </ActionButton>
                </DialogActions>
            </AppModal>
            <AppModal
                isOpen={isDynamicPromptOpen}
                onClose={onCloseDynamicPrompt}
                title="Fill report filters"
            >
                <p className="field-note">
                    This saved report asks for values when it runs. Enter them now to update the
                    report results.
                </p>
                <div className="report-filter-stack">
                    {promptFilters.map((filter) => (
                        <ReportFieldValueControl
                            customers={customers}
                            filter={filter}
                            key={filter.id}
                            onUpdateFilter={onUpdateFilter}
                        />
                    ))}
                </div>
                <DialogActions>
                    <ActionButton onClick={onCloseDynamicPrompt} variant="primary">
                        Run report
                    </ActionButton>
                </DialogActions>
            </AppModal>
        </>
    );
};
