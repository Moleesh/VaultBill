/** @format */

import { useEffect, useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
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

/**
 * Loads the business profile, printer defaults, and persistence handlers for the SysAdmin panel.
 */
export const useSettingsBusinessSection = () => {
    const capabilities = useCapabilities();
    const [companyName, setCompanyName] = useState(defaultWorkspaceSettings.companyName);
    const [address, setAddress] = useState(defaultWorkspaceSettings.address);
    const [gstin, setGstin] = useState(defaultWorkspaceSettings.gstin);
    const [theme, setTheme] = useState(
        () => window.localStorage.getItem('vaultbill.theme') ?? 'teal-flow',
    );
    const [outputTarget, setOutputTarget] = useState(defaultWorkspaceSettings.outputTarget);
    const [preferredPrinterName, setPreferredPrinterName] = useState(
        defaultWorkspaceSettings.preferredPrinterName,
    );
    const [includeDraftsInReports, setIncludeDraftsInReports] = useState(
        defaultWorkspaceSettings.includeDraftsInReports,
    );
    const [availablePrinters, setAvailablePrinters] = useState<readonly PrinterSummary[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const businessRequest = window.vaultBillDesktop
            ? loadWorkspaceSettings(false)
            : capabilities.isHostedWeb
              ? requestHostedApi('/settings/business').then(normalizeWorkspaceSettings)
              : Promise.resolve(defaultWorkspaceSettings);
        void businessRequest.then((settings) => {
            setCompanyName(settings.companyName);
            setAddress(settings.address);
            setGstin(settings.gstin);
            setTheme(settings.theme);
            setOutputTarget(settings.outputTarget);
            setPreferredPrinterName(settings.preferredPrinterName);
            setIncludeDraftsInReports(settings.includeDraftsInReports);
        });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        if (!window.vaultBillDesktop?.listPrinters) {
            setAvailablePrinters([]);
            return;
        }
        void window.vaultBillDesktop.listPrinters().then((printers) => {
            setAvailablePrinters(printers);
            if (
                preferredPrinterName &&
                !printers.some((printer) => printer.name === preferredPrinterName)
            ) {
                setPreferredPrinterName('');
                return;
            }
            if (!preferredPrinterName) {
                const defaultPrinter = printers.find((printer) => printer.isDefault)?.name ?? '';
                if (defaultPrinter) setPreferredPrinterName(defaultPrinter);
            }
        });
    }, [preferredPrinterName]);

    const saveBusiness = () => {
        if (!companyName.trim() || !address.trim()) {
            setMessage('Business name and address are required.');
            return;
        }
        const nextBusiness = {
            companyName: companyName.trim(),
            address: address.trim(),
            gstin: gstin.trim(),
            theme,
            outputTarget,
            preferredPrinterName: preferredPrinterName.trim(),
            includeDraftsInReports,
        };
        window.localStorage.setItem('vaultbill.theme', theme);
        document.documentElement.dataset.theme = theme;
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveBusinessSettings(nextBusiness)
            : capabilities.isHostedWeb
              ? requestHostedApi('/settings/business', 'POST', nextBusiness)
              : Promise.resolve(nextBusiness);
        void persistence
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
    };

    return {
        address,
        availablePrinters,
        capabilities,
        companyName,
        gstin,
        message,
        outputTarget,
        preferredPrinterName,
        saveBusiness,
        setAddress,
        setCompanyName,
        setGstin,
        setIncludeDraftsInReports,
        setOutputTarget,
        setPreferredPrinterName,
        setTheme,
        theme,
    };
};
