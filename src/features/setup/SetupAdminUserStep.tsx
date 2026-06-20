/** @format */

import type { FC } from 'react';

type SetupAdminUserStepProps = {
    readonly username: string;
    readonly displayName: string;
    readonly password: string;
    readonly showValidation: boolean;
    readonly onUsernameChange: (value: string) => void;
    readonly onDisplayNameChange: (value: string) => void;
    readonly onPasswordChange: (value: string) => void;
};

/** Collects the first Admin account created during first-run setup. */
export const SetupAdminUserStep: FC<SetupAdminUserStepProps> = ({
    username,
    displayName,
    password,
    showValidation,
    onUsernameChange,
    onDisplayNameChange,
    onPasswordChange,
}) => (
    <div className="form-grid">
        <label>
            <span>
                Admin display name
                <span aria-hidden="true" className="required-indicator">
                    *
                </span>
            </span>
            <input
                autoFocus
                aria-invalid={showValidation && displayName.trim().length === 0}
                onChange={(event) => {
                    onDisplayNameChange(event.currentTarget.value);
                }}
                placeholder="Name shown across the workspace"
                required
                value={displayName}
            />
        </label>
        <label>
            <span>
                Admin username
                <span aria-hidden="true" className="required-indicator">
                    *
                </span>
            </span>
            <input
                aria-invalid={showValidation && username.trim().length === 0}
                onChange={(event) => {
                    onUsernameChange(event.currentTarget.value);
                }}
                placeholder="Short sign-in name"
                required
                value={username}
            />
        </label>
        <label className="span-2">
            <span>Admin password (optional)</span>
            <input
                autoComplete="new-password"
                onChange={(event) => {
                    onPasswordChange(event.currentTarget.value);
                }}
                placeholder="Leave blank to add a password later"
                type="password"
                value={password}
            />
        </label>
        <p className="field-note span-2">
            Leave this blank for now, or add a password before finishing setup.
        </p>
    </div>
);
