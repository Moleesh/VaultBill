/** @format */

import type { FC } from 'react';

type SetupBusinessProfileStepProps = {
    readonly companyName: string;
    readonly address: string;
    readonly onCompanyNameChange: (value: string) => void;
    readonly onAddressChange: (value: string) => void;
};

/** Collects the business identity used by invoices and reports. */
export const SetupBusinessProfileStep: FC<SetupBusinessProfileStepProps> = ({
    companyName,
    address,
    onCompanyNameChange,
    onAddressChange,
}) => (
    <div className="form-grid">
        <label>
            <span>Business name</span>
            <input
                autoFocus
                onChange={(event) => {
                    onCompanyNameChange(event.currentTarget.value);
                }}
                placeholder="Registered business name"
                required
                value={companyName}
            />
        </label>
        <label className="span-2">
            <span>Business address</span>
            <textarea
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
