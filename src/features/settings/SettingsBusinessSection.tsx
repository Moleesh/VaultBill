/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { SettingsBusinessThemePicker } from './SettingsBusinessThemePicker';

import { useSettingsBusinessSection } from './useSettingsBusinessSection';

/**
 * Renders the SysAdmin business profile, theme, and printer defaults form.
 */
export const SettingsBusinessSection: FC = () => {
    const { availablePrinters, capabilities, form, message, saveBusiness } =
        useSettingsBusinessSection();

    return (
        <form
            className="settings-section"
            id="business"
            onSubmit={(event) => {
                event.preventDefault();
                saveBusiness();
            }}
        >
            <header>
                <p className="eyebrow">Business</p>
                <h2>Business profile</h2>
            </header>
            <div className="form-grid">
                <form.Field name="companyName">
                    {(field) => (
                        <FormField.TextField
                            label="Business name"
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="address">
                    {(field) => (
                        <FormField.TextAreaField
                            label="Business address"
                            onBlur={field.handleBlur}
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                            }}
                            value={field.state.value}
                            wrapperClassName="span-2"
                        />
                    )}
                </form.Field>
                <SettingsBusinessThemePicker
                    note="Pick the theme you want on the sign-in screen and across the workspace."
                    onThemeChange={(value) => {
                        form.setFieldValue('theme', value);
                    }}
                    theme={form.state.values.theme}
                    wrapperClassName="span-2"
                />
                <SearchableDropdown
                    label="Preferred printer"
                    loading={capabilities.isDesktop && availablePrinters.length === 0}
                    onChange={(value) => {
                        form.setFieldValue('preferredPrinterName', value);
                    }}
                    options={
                        availablePrinters.length > 0
                            ? availablePrinters.map((printer) => ({
                                  value: printer.name,
                                  label: printer.name,
                                  ...(printer.isDefault ? { description: 'Default printer' } : {}),
                              }))
                            : [
                                  {
                                      value: '',
                                      label: capabilities.isDesktop
                                          ? 'No desktop printers found'
                                          : 'Available in VaultBill Desktop',
                                      disabled: true,
                                  },
                              ]
                    }
                    value={form.state.values.preferredPrinterName}
                />
                <p className="field-note span-2">
                    Choose only from installed printers. Print behavior is defined with each
                    document format. Business profile details and printer defaults are saved
                    together here.
                </p>
            </div>
            <div className="settings-inline-actions">
                <ActionButton type="submit" variant="primary">
                    Save business
                </ActionButton>
            </div>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </form>
    );
};
