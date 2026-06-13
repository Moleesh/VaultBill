/** @format */

import type { FC } from 'react';

type SetupAdminUserStepProps = {
    readonly username: string;
    readonly displayName: string;
    readonly showValidation: boolean;
    readonly onUsernameChange: (value: string) => void;
    readonly onDisplayNameChange: (value: string) => void;
};

/** Collects the first Admin account created during first-run setup. */
export const SetupAdminUserStep: FC<SetupAdminUserStepProps> = ({
    username,
    displayName,
    showValidation,
    onUsernameChange,
    onDisplayNameChange,
}) => (
    <div className="form-grid">
        <label>
            <span>
                Admin username
                {showValidation ? <span className="required-indicator"> *</span> : null}
            </span>
            <input
                autoFocus
                aria-invalid={showValidation && username.trim().length === 0}
                onChange={(event) => {
                    onUsernameChange(event.currentTarget.value);
                }}
                placeholder="admin"
                required
                value={username}
            />
        </label>
        <label>
            <span>
                Admin display name
                {showValidation ? <span className="required-indicator"> *</span> : null}
            </span>
            <input
                aria-invalid={showValidation && displayName.trim().length === 0}
                onChange={(event) => {
                    onDisplayNameChange(event.currentTarget.value);
                }}
                placeholder="Operations Admin"
                required
                value={displayName}
            />
        </label>
        <div className="feedback-info span-2">
            The protected System Administrator account is already built in. This step creates the
            first Admin account for day-to-day use.
        </div>
    </div>
);
