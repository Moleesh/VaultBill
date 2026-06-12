/** @format */

import type { FC } from 'react';

import { createEmptyRecord, emptyLineItem } from './RecordsPageSupport';
import { RecordsDialogs } from './RecordsDialogs';
import { RecordsPageTop } from './RecordsPageTop';
import { RecordsReprintPanel } from './RecordsReprintPanel';
import { RecordsWorkspace } from './RecordsWorkspace';
import { useRecordsPageController } from './useRecordsPageController';

/** Renders the record creation and reprint experience. */
export const RecordsPage: FC = () => {
    const controller = useRecordsPageController();

    return (
        <div className="page-stack records-page">
            <RecordsPageTop
                activeTab={controller.activeTab}
                formatOptions={controller.formatOptions}
                onFormatChange={(formatId) => {
                    const format = controller.formatOptions.find((item) => item.value === formatId);
                    if (!format) return;
                    controller.markChanged({
                        ...controller.record,
                        formatId,
                        formatName: format.label,
                        fieldValues: {},
                        lineItems: [emptyLineItem()],
                        grandTotal: '0.00',
                    });
                }}
                onTabChange={(tab) => {
                    controller.setSearchParams({ tab });
                    controller.setActionState(tab === 'create' ? 'New' : 'Reprint');
                    if (tab === 'create') controller.setRecord(createEmptyRecord());
                }}
                recordFormatName={controller.record.formatName}
                selectedFormatId={controller.record.formatId}
            />
            {controller.activeTab === 'reprint' && !controller.selectedStoredRecord ? (
                <RecordsReprintPanel
                    error={controller.error}
                    isLoading={controller.isLoading}
                    onSearchChange={controller.setSearchQuery}
                    onSelect={controller.selectReprintRecord}
                    query={controller.searchQuery}
                    records={controller.reprintRecords}
                />
            ) : (
                <RecordsWorkspace
                    activeTab={controller.activeTab}
                    actionState={
                        controller.activeTab === 'reprint' ? 'Reprint' : controller.actionState
                    }
                    configuredDocumentFields={controller.configuredDocumentFields}
                    configuredLineFields={controller.configuredLineFields}
                    formRef={controller.formRef}
                    isReadOnly={controller.isReadOnly}
                    notice={controller.notice}
                    onAction={controller.runAction}
                    onAddLineItem={() => {
                        controller.markChanged({
                            ...controller.record,
                            lineItems: [...controller.record.lineItems, emptyLineItem()],
                        });
                    }}
                    onBackToSearch={() => {
                        controller.setRecord(createEmptyRecord());
                        controller.setActionState('Reprint');
                    }}
                    onCancelFinalizeRecord={controller.openCancel}
                    onEntryNavigation={controller.handleEntryNavigation}
                    onRecordChange={controller.markChanged}
                    onUpdateLineItem={controller.updateLineItem}
                    operationError={controller.operationError}
                    printLabel={controller.printLabel}
                    record={controller.record}
                    recordTotals={controller.recordTotals}
                    selectedStoredRecord={controller.selectedStoredRecord}
                    showCancelButton={
                        controller.activeTab === 'reprint' &&
                        controller.selectedStoredRecord?.status === 'Finalized' &&
                        controller.operatorContext?.role !== 'User'
                    }
                    showShortcuts={controller.showShortcuts}
                    statusLabel={
                        controller.actionState !== 'New' && controller.actionState !== 'DraftDirty'
                            ? controller.actionState === 'DraftSaved'
                                ? 'Draft'
                                : (controller.selectedStoredRecord?.status ??
                                  controller.actionState)
                            : ''
                    }
                />
            )}
            <RecordsDialogs
                cancelReason={controller.cancelReason}
                isCancelOpen={controller.isCancelOpen}
                isFinalizeOpen={controller.isFinalizeOpen}
                onCancelOutput={controller.cancelOutput}
                onCancelReasonChange={controller.setCancelReason}
                onCloseCancel={controller.closeCancel}
                onCloseFinalize={controller.closeFinalize}
                onCloseOutput={controller.closeOutput}
                onConfirmFinalize={controller.confirmFinalize}
                onConfirmRecordCancel={controller.confirmRecordCancel}
                outputTask={controller.outputTask}
            />
        </div>
    );
};
