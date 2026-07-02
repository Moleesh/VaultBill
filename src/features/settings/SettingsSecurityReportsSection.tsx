/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';

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
        <FormField.CheckboxField
            checked={includeDraftsInReports}
            label="Include draft records in reports"
            note="When this is on, reports can include drafts alongside finalized records."
            onChange={(event) => {
                onIncludeDraftsInReportsChange(event.currentTarget.checked);
            }}
        />
    </div>
);
