/** @format */

import type { FC } from 'react';

type SetupBusinessProfileStepProps = {
    readonly companyName: string;
    readonly address: string;
    readonly showValidation: boolean;
    readonly onCompanyNameChange: (value: string) => void;
    readonly onAddressChange: (value: string) => void;
};

/** Collects the business identity used by invoices and reports. */
export const SetupBusinessProfileStep: FC<SetupBusinessProfileStepProps> = ({
    companyName,
    address,
    showValidation,
    onCompanyNameChange,
    onAddressChange,
}) => (
    <div className="form-grid">
        <label>
            <span>
                Business name
                {showValidation ? <span className="required-indicator"> *</span> : null}
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
                {showValidation ? <span className="required-indicator"> *</span> : null}
            </span>
            <textarea
                aria-invalid={showValidation && address.trim().length === 0}
                onChange={(event) => {
                    onAddressChange(event.currentTarget.value);
                }}
                placeholder="Address shown on invoices and reports"
                required
                value={address}
            />
        </label>
    </div>
);
