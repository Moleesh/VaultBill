/** @format */

import type { FC } from 'react';

import type { DocumentFormatSummary } from '../types/AppTypes';

type FormatSelectorProps = {
    readonly activeFormatId: string;
    readonly formats: readonly DocumentFormatSummary[];
    readonly onChange: (format: DocumentFormatSummary) => void;
};

export const FormatSelector: FC<FormatSelectorProps> = ({ activeFormatId, formats, onChange }) => {
    const handleChange = (value: string) => {
        const selectedFormat = formats.find((format) => format.formatId === value);

        if (selectedFormat) {
            onChange(selectedFormat);
        }
    };

    return (
        <label className="format-selector">
            <span>Document format</span>
            <select
                aria-describedby="format-selector-help"
                value={activeFormatId}
                onChange={(event) => {
                    handleChange(event.currentTarget.value);
                }}
            >
                {formats.map((format) => (
                    <option key={format.formatId} value={format.formatId}>
                        {format.formatName}
                    </option>
                ))}
            </select>
            <small id="format-selector-help">
                Same-page format switching keeps VaultBill SPA-first.
            </small>
        </label>
    );
};
