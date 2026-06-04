import type { FC } from 'react';

import { hasCapability } from '../engines/permissionEngine/PermissionEngine';
import { getShortcutForAction } from '../features/settings/accessibility/KeyboardShortcuts';
import type { Role } from '../types/AppTypes';

type ActionBarProps = {
  readonly role: Role;
};

export const ActionBar: FC<ActionBarProps> = ({ role }) => {
  const canSaveDraft = hasCapability(role, 'SaveDraft');
  const canDraftPrint = hasCapability(role, 'DraftPrint');
  const canFinalPrint = hasCapability(role, 'FinalPrintReprint');

  return (
    <div className="action-bar" role="region" aria-label="Record actions">
      <ActionButton actionId="save-draft" disabled={!canSaveDraft} />
      <ActionButton actionId="draft-print" disabled={!canDraftPrint} />
      <ActionButton actionId="download-pdf" disabled={!canFinalPrint} />
      <ActionButton
        actionId="finalize"
        className="action-bar__primary"
        disabled={!canFinalPrint}
      />
    </div>
  );
};

type ActionButtonProps = {
  readonly actionId: string;
  readonly className?: string;
  readonly disabled: boolean;
};

const ActionButton: FC<ActionButtonProps> = ({ actionId, className, disabled }) => {
  const shortcut = getShortcutForAction(actionId);

  if (!shortcut) {
    return null;
  }

  return (
    <button
      aria-keyshortcuts={shortcut.keys}
      className={className}
      disabled={disabled}
      title={`${shortcut.description} Shortcut: ${shortcut.keys}`}
      type="button"
    >
      <span>{shortcut.label}</span>
      <kbd>{shortcut.keys}</kbd>
    </button>
  );
};
