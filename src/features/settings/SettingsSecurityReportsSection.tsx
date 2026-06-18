/** @format */

import type { FC } from 'react';

type SettingsSecurityReportsSectionProps = {
    readonly includeDraftsInReports: boolean;
    readonly onIncludeDraftsInReportsChange: (value: boolean) => void;
};

export const SettingsSecurityReportsSection: FC<SettingsSecurityReportsSectionProps> = ({
    includeDraftsInReports,
    onIncludeDraftsInReportsChange,
}) => (
    <div className="settings-subsection">
        <div className="section-heading">
            <div>
                <h3>Reports</h3>
                <p>Control whether draft records appear in report queries.</p>
            </div>
        </div>
        <label className="checkbox-field">
            <input
                checked={includeDraftsInReports}
                onChange={(event) => {
                    onIncludeDraftsInReportsChange(event.currentTarget.checked);
                }}
                type="checkbox"
            />
            <span>Include draft records in reports</span>
        </label>
        <p className="field-note">
            When this is on, reports can include drafts alongside finalized records.
        </p>
    </div>
);
