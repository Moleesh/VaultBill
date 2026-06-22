/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import { SettingsBusinessThemePicker } from '../settings/SettingsBusinessThemePicker';
import type { SetupFormApi } from './useSetupForm';

type SetupBusinessProfileStepProps = {
    readonly form: SetupFormApi;
    readonly showValidation: boolean;
    readonly onThemeChange: (value: string) => void;
    readonly onFieldTouched: () => void;
};

/** Collects the business identity and opening theme used across the workspace. */
export const SetupBusinessProfileStep: FC<SetupBusinessProfileStepProps> = ({
    form,
    showValidation,
    onThemeChange,
    onFieldTouched,
}) => (
    <div className="form-grid">
        <form.Field name="companyName">
            {(field) => (
                <FormField.TextField
                    autoFocus
                    invalid={
                        (showValidation || field.state.meta.isTouched) &&
                        field.state.value.trim().length === 0
                    }
                    label="Business name"
                    onBlur={() => {
                        field.handleBlur();
                        onFieldTouched();
                    }}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Business name shown across the workspace"
                    required
                    requiredIndicator
                    value={field.state.value}
                />
            )}
        </form.Field>
        <form.Field name="address">
            {(field) => (
                <FormField.TextAreaField
                    invalid={
                        (showValidation || field.state.meta.isTouched) &&
                        field.state.value.trim().length === 0
                    }
                    label="Business address"
                    onBlur={() => {
                        field.handleBlur();
                        onFieldTouched();
                    }}
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Primary business address for documents and reports"
                    required
                    requiredIndicator
                    value={field.state.value}
                    wrapperClassName="span-2"
                />
            )}
        </form.Field>
        <SettingsBusinessThemePicker
            note="Pick the theme you want to open with on the sign-in screen and in the workspace."
            onThemeChange={onThemeChange}
            theme={form.state.values.theme}
            wrapperClassName="span-2"
        />
    </div>
);
