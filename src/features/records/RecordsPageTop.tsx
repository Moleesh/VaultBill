/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';

type RecordsPageTopProps = {
    readonly activeTab: 'create' | 'reprint';
    readonly formatOptions: readonly { readonly value: string; readonly label: string }[];
    readonly onFormatChange: (formatId: string) => void;
    readonly onTabChange: (tab: 'create' | 'reprint') => void;
    readonly selectedFormatId: string;
    readonly recordFormatName: string;
};

/** Renders the page heading, format picker, and create/reprint tabs. */
export const RecordsPageTop: FC<RecordsPageTopProps> = ({
    activeTab,
    formatOptions,
    onFormatChange,
    onTabChange,
    selectedFormatId,
    recordFormatName,
}) => (
    <section className="records-page-top">
        <div className="operational-header records-page-top-header">
            <div className="records-page-top-copy">
                <h1>
                    {activeTab === 'create'
                        ? `Create ${recordFormatName}`
                        : 'Find and reprint records'}
                </h1>
            </div>
            {activeTab === 'create' ? (
                <SearchableDropdown
                    label="Format"
                    onChange={onFormatChange}
                    options={formatOptions}
                    value={selectedFormatId}
                    menuAlignment="right"
                    wrapperClassName="records-format-dropdown"
                />
            ) : null}
        </div>
        <HorizontalProgress
            className="page-tabs records-tabs records-page-top-tabs"
            label="Record tabs"
        >
            {(['create', 'reprint'] as const).map((tab) => (
                <ActionButton
                    aria-pressed={activeTab === tab}
                    key={tab}
                    onClick={() => {
                        onTabChange(tab);
                    }}
                >
                    {tab === 'create' ? 'Create' : 'Reprint'}
                </ActionButton>
            ))}
        </HorizontalProgress>
    </section>
);
