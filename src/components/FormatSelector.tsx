/** @format */

/** Compact document-format selector that highlights the active record template. */

import type { FC } from 'react';

import { SearchableDropdown } from './SearchableDropdown/SearchableDropdown';
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
            <SearchableDropdown
                label="Document format"
                onChange={handleChange}
                options={formats.map((format) => ({
                    value: format.formatId,
                    label: format.formatName,
                    description: format.description,
                }))}
                value={activeFormatId}
            />
            <small id="format-selector-help">
                Same-page format switching keeps VaultBill SPA-first.
            </small>
        </label>
    );
};
