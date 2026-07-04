/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { applyTheme } from '../../runtime/WorkspaceTheme';
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
            <div className="settings-section-stack">
                <div className="settings-section-card settings-section-card--business-details">
                    <div className="settings-section-grid settings-section-grid--business-core">
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
                                />
                            )}
                        </form.Field>
                    </div>
                </div>
                <div className="settings-section-card settings-section-card--business-preferences">
                    <div className="settings-section-grid settings-section-grid--business-preferences">
                        <SettingsBusinessThemePicker
                            note="Pick the theme you want on the sign-in screen and across the workspace."
                            onThemeChange={(value) => {
                                form.setFieldValue('theme', value);
                                applyTheme(value);
                            }}
                            theme={form.state.values.theme}
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
                                          ...(printer.isDefault
                                              ? { description: 'Default printer' }
                                              : {}),
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
                        <p className="field-note settings-section-grid-span-full">
                            Choose only from installed printers. Print behavior is defined with each
                            document format. Business profile details and printer defaults are saved
                            together here.
                        </p>
                    </div>
                    <div className="settings-inline-actions settings-inline-actions--end">
                        <ActionButton type="submit" variant="primary">
                            Save business
                        </ActionButton>
                    </div>
                </div>
            </div>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </form>
    );
};
