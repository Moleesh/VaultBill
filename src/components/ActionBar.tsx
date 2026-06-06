import type { FC } from 'react';

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
): readonly { id: string; label: string; enabled: boolean; primary?: boolean }[] => [
  {
    id: 'draft',
    label: 'Draft',
    enabled: state === 'New' || state === 'DraftDirty',
  },
  {
    id: 'draft-print',
    label: 'Draft Print',
    enabled: state === 'DraftSaved',
  },
  {
    id: 'finalize',
    label: 'Finalize',
    enabled: state === 'DraftSaved',
    primary: state === 'DraftSaved',
  },
  {
    id: state === 'Reprint' ? 'reprint' : 'print',
    label: state === 'Reprint' ? 'Reprint' : printLabel,
    enabled: state === 'Finalized' || state === 'Reprint',
    primary: state === 'Finalized' || state === 'Reprint',
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
          aria-keyshortcuts={showShortcuts ? shortcut?.keys : undefined}
          className={action.primary ? 'action-bar__primary' : undefined}
          data-action-id={action.id}
          disabled={!action.enabled}
          key={action.id}
          onClick={() => {
            onAction(action.id);
          }}
          title={shortcut ? shortcut.description : action.label}
          type="button"
        >
          <span>{action.label}</span>
          {showShortcuts && shortcut ? <kbd>{shortcut.keys}</kbd> : null}
        </button>
      );
    })}
  </div>
);
