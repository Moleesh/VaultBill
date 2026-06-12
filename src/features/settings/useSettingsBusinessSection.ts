/** @format */

import { useEffect, useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';

export type PrinterSummary = {
    readonly id: string;
    readonly name: string;
    readonly isDefault: boolean;
};

type BusinessProfile = {
    readonly companyName?: string;
    readonly address?: string;
};

type BusinessSettings = BusinessProfile & {
    readonly gstin?: string;
    readonly theme?: string;
    readonly outputTarget?: string;
};

const readProfile = (): BusinessProfile => {
    try {
        return JSON.parse(
            window.localStorage.getItem('vaultbill.business-profile') ?? '{}',
        ) as BusinessProfile;
    } catch {
        return {};
    }
};

/**
 * Loads the business profile, printer defaults, and persistence handlers for the SysAdmin panel.
 */
export const useSettingsBusinessSection = () => {
    const capabilities = useCapabilities();
    const profile = readProfile();
    const [companyName, setCompanyName] = useState(profile.companyName ?? '');
    const [address, setAddress] = useState(profile.address ?? '');
    const [gstin, setGstin] = useState(
        () => window.localStorage.getItem('vaultbill.company-gstin') ?? '',
    );
    const [theme, setTheme] = useState(
        () => window.localStorage.getItem('vaultbill.theme') ?? 'teal-flow',
    );
    const [outputTarget, setOutputTarget] = useState(
        () => window.localStorage.getItem('vaultbill.output-target') ?? 'PreviewOnly',
    );
    const [preferredPrinterName, setPreferredPrinterName] = useState(
        () => window.localStorage.getItem('vaultbill.preferred-printer') ?? '',
    );
    const [availablePrinters, setAvailablePrinters] = useState<readonly PrinterSummary[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const businessRequest = window.vaultBillDesktop
            ? window.vaultBillDesktop.getBusinessSettings()
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/business')
              : undefined;
        void businessRequest?.then((rawSettings) => {
            const settings = rawSettings as BusinessSettings;
            if (typeof settings.companyName === 'string') setCompanyName(settings.companyName);
            if (typeof settings.address === 'string') setAddress(settings.address);
            if (typeof settings.gstin === 'string') setGstin(settings.gstin);
            if (typeof settings.theme === 'string') setTheme(settings.theme);
            if (typeof settings.outputTarget === 'string') setOutputTarget(settings.outputTarget);
        });
        if (!window.vaultBillDesktop?.listPrinters) {
            setAvailablePrinters([]);
            return;
        }
        void window.vaultBillDesktop.listPrinters().then((printers) => {
            setAvailablePrinters(printers);
            const savedPrinter = window.localStorage.getItem('vaultbill.preferred-printer') ?? '';
            if (savedPrinter && !printers.some((printer) => printer.name === savedPrinter)) {
                window.localStorage.removeItem('vaultbill.preferred-printer');
                setPreferredPrinterName('');
                return;
            }
            if (!savedPrinter) {
                const defaultPrinter = printers.find((printer) => printer.isDefault)?.name ?? '';
                if (defaultPrinter) {
                    setPreferredPrinterName(defaultPrinter);
                    window.localStorage.setItem('vaultbill.preferred-printer', defaultPrinter);
                }
            }
        });
    }, [capabilities.isLanBrowser]);

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
        };
        window.localStorage.setItem(
            'vaultbill.business-profile',
            JSON.stringify({
                companyName: nextBusiness.companyName,
                address: nextBusiness.address,
            }),
        );
        window.localStorage.setItem('vaultbill.company-gstin', nextBusiness.gstin);
        window.localStorage.setItem('vaultbill.theme', theme);
        window.localStorage.setItem('vaultbill.output-target', outputTarget);
        if (nextBusiness.preferredPrinterName) {
            window.localStorage.setItem(
                'vaultbill.preferred-printer',
                nextBusiness.preferredPrinterName,
            );
        } else {
            window.localStorage.removeItem('vaultbill.preferred-printer');
        }
        document.documentElement.dataset.theme = theme;
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveBusinessSettings(nextBusiness)
            : capabilities.isLanBrowser
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
        setOutputTarget,
        setPreferredPrinterName,
        setTheme,
        theme,
    };
};
