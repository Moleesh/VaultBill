/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { AppModal } from '../../components/AppModal/AppModal';
import { DialogActions } from '../../components/DialogActions';
import type { PrintTask } from './ReportsPageSupport';

type ReportsPrintTaskModalProps = {
    readonly task: PrintTask | undefined;
    readonly onClose: () => void;
    readonly onContinue: () => void;
    readonly onCancelOutput: () => void;
};

export const ReportsPrintTaskModal: FC<ReportsPrintTaskModalProps> = ({
    task,
    onClose,
    onContinue,
    onCancelOutput,
}) => (
    <AppModal
        isOpen={Boolean(task)}
        onClose={() => {
            if (!task?.running) onClose();
        }}
        title={task?.kind === 'records' ? 'Printing records' : 'Printing report'}
    >
        {task ? (
            <div className="print-progress">
                <div>
                    <strong>
                        {task.completed} of {task.total}
                    </strong>
                    <span>
                        {task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0}%
                    </span>
                </div>
                <progress max={Math.max(task.total, 1)} value={task.completed} />
                {task.message ? <p>{task.message}</p> : null}
                {task.awaitingContinue ? (
                    <DialogActions>
                        <ActionButton
                            onClick={() => {
                                onClose();
                            }}
                        >
                            Stop
                        </ActionButton>
                        <ActionButton onClick={onContinue} variant="primary">
                            Print next 10
                        </ActionButton>
                    </DialogActions>
                ) : (
                    <ActionButton onClick={onCancelOutput}>
                        {task.running ? 'Cancel output' : 'Close'}
                    </ActionButton>
                )}
            </div>
        ) : null}
    </AppModal>
);
