import type { FC } from 'react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { AppModal } from '../../components/AppModal/AppModal';

type RecordDialogsProps = {
  readonly pendingFormatId: string | undefined;
  readonly isFinalizeOpen: boolean;
  readonly onCancelFormat: () => void;
  readonly onClearAndChangeFormat: () => void;
  readonly onFinalize: () => void;
  readonly onKeepAndChangeFormat: () => void;
  readonly onSetFinalizeOpen: (isOpen: boolean) => void;
};

export const RecordDialogs: FC<RecordDialogsProps> = ({
  isFinalizeOpen,
  onCancelFormat,
  onClearAndChangeFormat,
  onFinalize,
  onKeepAndChangeFormat,
  onSetFinalizeOpen,
  pendingFormatId,
}) => (
  <>
    <AppModal
      isOpen={pendingFormatId !== undefined}
      onClose={onCancelFormat}
      title="Change document format?"
    >
      <p>You have unsaved values. Choose how VaultBill should handle them.</p>
      <div className="popup-actions popup-actions--stack">
        <button onClick={onKeepAndChangeFormat} type="button">
          Keep matching fields
        </button>
        <button onClick={onClearAndChangeFormat} type="button">
          Clear form
        </button>
        <button onClick={onCancelFormat} type="button">
          Cancel
        </button>
      </div>
    </AppModal>
    <AppConfirmDialog
      confirmLabel="Finalize"
      description="VaultBill will allocate the next document number and lock this record for editing."
      isOpen={isFinalizeOpen}
      onCancel={() => {
        onSetFinalizeOpen(false);
      }}
      onConfirm={onFinalize}
      title="Finalize this document?"
    />
  </>
);
