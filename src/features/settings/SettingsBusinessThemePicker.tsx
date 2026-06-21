/** @format */

import { Palette } from 'lucide-react';
import type { FC, ReactNode } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { themeOptions } from '../../constants/RuntimeDefaults';

const themeSwatches = {
    'teal-flow': ['#0f7f75', '#dff4ef'],
    'slate-pro': ['#40566f', '#e7edf3'],
    'midnight-ink': ['#172436', '#4cc9a5'],
    'sandstone-ledger': ['#9a6b32', '#f1e4c9'],
    'indigo-mint': ['#4056a1', '#ccefe0'],
} as const;

type SettingsBusinessThemePickerProps = {
    readonly note?: ReactNode;
    readonly theme: string;
    readonly onThemeChange: (value: string) => void;
    readonly wrapperClassName?: string;
};

/** Renders the theme swatches used by the business settings panel. */
export const SettingsBusinessThemePicker: FC<SettingsBusinessThemePickerProps> = ({
    note,
    theme,
    onThemeChange,
    wrapperClassName,
}) => (
    <FormField.Wrapper
        label={
            <>
                <Palette aria-hidden="true" size={17} /> Theme
            </>
        }
        note={note}
        wrapperClassName={
            wrapperClassName ? `settings-theme-picker ${wrapperClassName}` : 'settings-theme-picker'
        }
    >
        <div className="settings-theme-picker-options" role="radiogroup" aria-label="Theme">
            {themeOptions.map((option) => (
                <ActionButton
                    aria-checked={theme === option.id}
                    aria-pressed={theme === option.id}
                    key={option.id}
                    onClick={() => {
                        onThemeChange(option.id);
                        document.documentElement.dataset.theme = option.id;
                    }}
                    role="radio"
                    title={option.label}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            background: `linear-gradient(135deg, ${themeSwatches[option.id][0]} 50%, ${themeSwatches[option.id][1]} 50%)`,
                        }}
                    />
                    <small>{option.label}</small>
                </ActionButton>
            ))}
        </div>
    </FormField.Wrapper>
);
