/** @format */

import { Palette } from 'lucide-react';
import type { FC } from 'react';

import { themeOptions } from '../../constants/PhaseOneSeed';

const themeSwatches = {
    'teal-flow': ['#0f7f75', '#dff4ef'],
    'slate-pro': ['#40566f', '#e7edf3'],
    'midnight-ink': ['#172436', '#4cc9a5'],
    'sandstone-ledger': ['#9a6b32', '#f1e4c9'],
    'indigo-mint': ['#4056a1', '#ccefe0'],
} as const;

type SettingsBusinessThemePickerProps = {
    readonly theme: string;
    readonly onThemeChange: (value: string) => void;
};

/** Renders the theme swatches used by the business settings panel. */
export const SettingsBusinessThemePicker: FC<SettingsBusinessThemePickerProps> = ({
    theme,
    onThemeChange,
}) => (
    <fieldset className="settings-theme-picker">
        <legend>
            <Palette aria-hidden="true" size={17} /> Theme
        </legend>
        <div>
            {themeOptions.map((option) => (
                <button
                    aria-pressed={theme === option.id}
                    key={option.id}
                    onClick={() => {
                        onThemeChange(option.id);
                        document.documentElement.dataset.theme = option.id;
                    }}
                    title={option.label}
                    type="button"
                >
                    <span
                        aria-hidden="true"
                        style={{
                            background: `linear-gradient(135deg, ${themeSwatches[option.id][0]} 50%, ${themeSwatches[option.id][1]} 50%)`,
                        }}
                    />
                    <small>{option.label}</small>
                </button>
            ))}
        </div>
    </fieldset>
);
