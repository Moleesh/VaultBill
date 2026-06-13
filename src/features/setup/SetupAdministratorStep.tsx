/** @format */

import type { FC } from 'react';

type SetupAdministratorStepProps = {
    readonly sysAdminName: string;
    readonly onSysAdminNameChange: (value: string) => void;
};

/** Collects the display name for the initial System Administrator account. */
export const SetupAdministratorStep: FC<SetupAdministratorStepProps> = ({
    sysAdminName,
    onSysAdminNameChange,
}) => (
    <div className="form-grid">
        <label>
            <span>Administrator display name</span>
            <input
                autoFocus
                onChange={(event) => {
                    onSysAdminNameChange(event.currentTarget.value);
                }}
                value={sysAdminName}
            />
        </label>
        <div className="feedback-info span-2">
            VaultBill initializes the administrator and backup passwords securely. Change both from
            Security after your first login.
        </div>
    </div>
);
