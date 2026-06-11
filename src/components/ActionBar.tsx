/** @format */

import type { FC } from 'react';
import { LockKeyhole } from 'lucide-react';

import { getShortcutForAction } from '../features/settings/accessibility/KeyboardShortcuts';

export type RecordActionState = 'New' | 'DraftSaved' | 'DraftDirty' | 'Finalized' | 'Reprint';

type ActionBarProps = {
    readonly state: RecordActionState;
    readonly onAction: (actionId: string) => void;
    readonly showShortcuts?: boolean;
    readonly printLabel?: string;
};

const getActions = (
    state: RecordActionState,
    printLabel: string,
): readonly {
    id: string;
    label: string;
    enabled: boolean;
    primary?: boolean;
    unavailableReason?: string;
}[] => [
    {
        id: 'draft',
        label: 'Draft',
        enabled: state === 'New' || state === 'DraftDirty',
        unavailableReason: 'This draft is already saved.',
    },
    {
        id: 'draft-print',
        label: 'Draft Print',
        enabled: state === 'DraftSaved',
        unavailableReason: 'Save the draft before printing it.',
    },
    {
        id: 'finalize',
        label: 'Finalize',
        enabled: state === 'DraftSaved',
        primary: state === 'DraftSaved',
        unavailableReason: 'Save the draft before finalizing it.',
    },
    {
        id: state === 'Reprint' ? 'reprint' : 'print',
        label: state === 'Reprint' ? 'Reprint' : printLabel,
        enabled: state === 'Finalized' || state === 'Reprint',
        primary: state === 'Finalized' || state === 'Reprint',
        unavailableReason: 'Finalize the document before printing it.',
    },
];

export const ActionBar: FC<ActionBarProps> = ({
    onAction,
    printLabel = 'Print',
    showShortcuts = true,
    state,
}) => (
    <div className="action-bar" role="region" aria-label="Record actions">
        {getActions(state, printLabel).map((action) => {
            const shortcut = getShortcutForAction(action.id);

            return (
                <button
                    aria-disabled={!action.enabled}
                    aria-keyshortcuts={showShortcuts ? shortcut?.keys : undefined}
                    className={`${action.primary ? 'action-bar__primary' : ''}${
                        action.enabled ? '' : ' action-bar__unavailable'
                    }`}
                    data-action-id={action.id}
                    key={action.id}
                    onClick={() => {
                        if (!action.enabled) {
                            const status =
                                document.querySelector<HTMLElement>('#record-action-status');
                            if (status)
                                status.textContent =
                                    action.unavailableReason ?? 'Action unavailable.';
                            return;
                        }
                        onAction(action.id);
                    }}
                    title={
                        action.enabled
                            ? (shortcut?.description ?? action.label)
                            : (action.unavailableReason ?? 'Action unavailable.')
                    }
                    type="button"
                >
                    {!action.enabled ? <LockKeyhole aria-hidden="true" size={16} /> : null}
                    <span>{action.label}</span>
                    {showShortcuts && shortcut ? <kbd>{shortcut.keys}</kbd> : null}
                </button>
            );
        })}
    </div>
);
