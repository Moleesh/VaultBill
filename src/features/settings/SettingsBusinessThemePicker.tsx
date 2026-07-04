/** @format */

import type { FC, ReactNode } from 'react';

import { Palette } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { themeOptions } from '../../constants/RuntimeDefaults';
import { getThemeSwatchBackground } from '../../runtime/WorkspaceTheme';

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
}) => {
    return (
        <FormField.Wrapper
            as="div"
            label={
                <>
                    <Palette aria-hidden="true" size={17} /> Theme
                </>
            }
            note={note}
            wrapperClassName={
                wrapperClassName
                    ? `settings-theme-picker ${wrapperClassName}`
                    : 'settings-theme-picker'
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
                        }}
                        role="radio"
                        title={option.label}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                background: getThemeSwatchBackground(option.id),
                            }}
                        />
                        <small>{option.label}</small>
                    </ActionButton>
                ))}
            </div>
        </FormField.Wrapper>
    );
};
