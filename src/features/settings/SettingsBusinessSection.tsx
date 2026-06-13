/** @format */

import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { SettingsBusinessThemePicker } from './SettingsBusinessThemePicker';
import { useSettingsBusinessSection } from './useSettingsBusinessSection';

/**
 * Renders the SysAdmin business profile, theme, and printer defaults form.
 */
export const SettingsBusinessSection: FC = () => {
    const {
        address,
        availablePrinters,
        capabilities,
        companyName,
        message,
        preferredPrinterName,
        saveBusiness,
        setAddress,
        setCompanyName,
        setPreferredPrinterName,
        setTheme,
        theme,
    } = useSettingsBusinessSection();

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
                <label>
                    <span>Business name</span>
                    <input
                        value={companyName}
                        onChange={(event) => {
                            setCompanyName(event.currentTarget.value);
                        }}
                    />
                </label>
                <label className="span-2">
                    <span>Business address</span>
                    <textarea
                        value={address}
                        onChange={(event) => {
                            setAddress(event.currentTarget.value);
                        }}
                    />
                </label>
                <SettingsBusinessThemePicker onThemeChange={setTheme} theme={theme} />
                <SearchableDropdown
                    label="Preferred printer"
                    loading={capabilities.isDesktop && availablePrinters.length === 0}
                    onChange={setPreferredPrinterName}
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
                    value={preferredPrinterName}
                />
                <p className="field-note span-2">
                    Choose only from installed printers. Print behavior is defined with each
                    document format.
                </p>
                <p className="field-note span-2">
                    Business profile details and printer defaults are saved together here.
                </p>
            </div>
            <div className="settings-inline-actions">
                <button className="button-primary" type="submit">
                    Save business
                </button>
            </div>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </form>
    );
};
