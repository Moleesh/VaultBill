/** @format */

import type { FC } from 'react';

import { SettingsBusinessThemePicker } from '../settings/SettingsBusinessThemePicker';

type SetupBusinessProfileStepProps = {
    readonly companyName: string;
    readonly address: string;
    readonly theme: string;
    readonly showValidation: boolean;
    readonly onCompanyNameChange: (value: string) => void;
    readonly onAddressChange: (value: string) => void;
    readonly onThemeChange: (value: string) => void;
};

/** Collects the business identity and opening theme used across the workspace. */
export const SetupBusinessProfileStep: FC<SetupBusinessProfileStepProps> = ({
    companyName,
    address,
    theme,
    showValidation,
    onCompanyNameChange,
    onAddressChange,
    onThemeChange,
}) => (
    <div className="form-grid">
        <label>
            <span>
                Business name
                <span aria-hidden="true" className="required-indicator">
                    *
                </span>
            </span>
            <input
                autoFocus
                aria-invalid={showValidation && companyName.trim().length === 0}
                onChange={(event) => {
                    onCompanyNameChange(event.currentTarget.value);
                }}
                placeholder="Registered business name"
                required
                value={companyName}
            />
        </label>
        <label className="span-2">
            <span>
                Business address
                <span aria-hidden="true" className="required-indicator">
                    *
                </span>
            </span>
            <textarea
                aria-invalid={showValidation && address.trim().length === 0}
                onChange={(event) => {
                    onAddressChange(event.currentTarget.value);
                }}
                placeholder="Primary business address"
                required
                value={address}
            />
        </label>
        <div className="span-2">
            <SettingsBusinessThemePicker onThemeChange={onThemeChange} theme={theme} />
            <p className="field-note">
                Pick the theme you want on the sign-in screen and across the workspace.
            </p>
        </div>
    </div>
);
