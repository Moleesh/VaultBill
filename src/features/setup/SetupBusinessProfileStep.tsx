/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import { useSetupPageContext } from './SetupPageContext';

/** Collects the business identity used across the workspace. */
export const SetupBusinessProfileStep: FC = () => {
    const { form, showBusinessProfileValidation } = useSetupPageContext();

    return (
        <div className="form-grid">
            <form.Field name="companyName">
                {(field) => (
                    <FormField.TextField
                        autoFocus
                        invalid={
                            showBusinessProfileValidation && field.state.value.trim().length === 0
                        }
                        label="Business name"
                        onBlur={field.handleBlur}
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
                            showBusinessProfileValidation && field.state.value.trim().length === 0
                        }
                        label="Business address"
                        onBlur={field.handleBlur}
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
        </div>
    );
};
