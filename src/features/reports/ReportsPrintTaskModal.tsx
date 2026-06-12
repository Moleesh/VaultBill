/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal/AppModal';
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
                    <div className="popup-actions">
                        <button
                            onClick={() => {
                                onClose();
                            }}
                            type="button"
                        >
                            Stop
                        </button>
                        <button className="button-primary" onClick={onContinue} type="button">
                            Print next 10
                        </button>
                    </div>
                ) : (
                    <button onClick={onCancelOutput} type="button">
                        {task.running ? 'Cancel output' : 'Close'}
                    </button>
                )}
            </div>
        ) : null}
    </AppModal>
);
