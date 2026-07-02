/** @format */

/** Compact document-format selector that highlights the active record template. */

import type { FC } from 'react';

import type { DocumentFormatSummary } from '../types/AppTypes';
import { SearchableDropdown } from './SearchableDropdown/SearchableDropdown';

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
        <SearchableDropdown
            label="Document format"
            note="Same-page format switching keeps VaultBill SPA-first."
            onChange={handleChange}
            options={formats.map((format) => ({
                value: format.formatId,
                label: format.formatName,
                description: format.description,
            }))}
            value={activeFormatId}
            wrapperClassName="format-selector"
        />
    );
};
