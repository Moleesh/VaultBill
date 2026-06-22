/** @format */

import { useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    applyTheme,
    loadResolvedTheme,
    resolveThemeFromWorkspaceSettings,
} from '../../runtime/WorkspaceTheme';
import {
    defaultWorkspaceSettings,
    loadWorkspaceSettings,
    normalizeWorkspaceSettings,
} from '../../runtime/WorkspaceSettings';

export type PrinterSummary = {
    readonly id: string;
    readonly name: string;
    readonly isDefault: boolean;
};

export type SettingsBusinessFormValues = {
    readonly address: string;
    readonly companyName: string;
    readonly gstin: string;
    readonly includeDraftsInReports: boolean;
    readonly outputTarget: 'PreviewOnly' | 'DownloadPdf' | 'SystemPrinter';
    readonly preferredPrinterName: string;
    readonly theme: string;
};

/**
 * Loads the business profile, printer defaults, and persistence handlers for the SysAdmin panel.
 */
export const useSettingsBusinessSection = () => {
    const capabilities = useCapabilities();
    const [availablePrinters, setAvailablePrinters] = useState<readonly PrinterSummary[]>([]);
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: {
            address: defaultWorkspaceSettings.address,
            companyName: defaultWorkspaceSettings.companyName,
            gstin: defaultWorkspaceSettings.gstin,
            includeDraftsInReports: defaultWorkspaceSettings.includeDraftsInReports,
            outputTarget: defaultWorkspaceSettings.outputTarget,
            preferredPrinterName: defaultWorkspaceSettings.preferredPrinterName,
            theme: defaultWorkspaceSettings.theme,
        } satisfies SettingsBusinessFormValues,
        onSubmit: async ({ value }) => {
            if (!value.companyName.trim() || !value.address.trim()) {
                setMessage('Business name and address are required.');
                return;
            }
            const nextBusiness = {
                companyName: value.companyName.trim(),
                address: value.address.trim(),
                gstin: value.gstin.trim(),
                theme: value.theme,
                outputTarget: value.outputTarget,
                preferredPrinterName: value.preferredPrinterName.trim(),
                includeDraftsInReports: value.includeDraftsInReports,
            };
            applyTheme(value.theme);
            const persistence = window.vaultBillDesktop
                ? window.vaultBillDesktop.saveBusinessSettings(nextBusiness)
                : capabilities.isHostedWeb
                  ? requestHostedApi('/settings/business', 'POST', nextBusiness)
                  : Promise.resolve(nextBusiness);
            await persistence
                .then(() => {
                    setMessage('Business settings saved.');
                })
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error
                            ? reason.message
                            : 'Business settings could not be saved.',
                    );
                });
        },
    });

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb).then((resolvedTheme) => {
            form.setFieldValue('theme', resolvedTheme);
            applyTheme(resolvedTheme);
        });
    }, [capabilities.isHostedWeb, form]);

    useEffect(() => {
        const businessRequest = window.vaultBillDesktop
            ? loadWorkspaceSettings(false)
            : capabilities.isHostedWeb
              ? requestHostedApi('/settings/business').then(normalizeWorkspaceSettings)
              : Promise.resolve(defaultWorkspaceSettings);
        void businessRequest.then((settings) => {
            form.reset(settings);
            const resolvedTheme = resolveThemeFromWorkspaceSettings(settings);
            form.setFieldValue('theme', resolvedTheme);
            applyTheme(resolvedTheme);
        });
    }, [capabilities.isHostedWeb, form]);

    useEffect(() => {
        if (!window.vaultBillDesktop?.listPrinters) {
            setAvailablePrinters([]);
            return;
        }
        void window.vaultBillDesktop.listPrinters().then((printers) => {
            setAvailablePrinters(printers);
            const { preferredPrinterName } = form.state.values;
            if (
                preferredPrinterName &&
                !printers.some((printer) => printer.name === preferredPrinterName)
            ) {
                form.setFieldValue('preferredPrinterName', '');
                return;
            }
            if (!preferredPrinterName) {
                const { name: defaultPrinter = '' } =
                    printers.find((printer) => printer.isDefault) ?? {};
                if (defaultPrinter) form.setFieldValue('preferredPrinterName', defaultPrinter);
            }
        });
    }, [form]);

    return {
        availablePrinters,
        capabilities,
        form,
        message,
        saveBusiness: () => {
            void form.handleSubmit();
        },
    };
};
