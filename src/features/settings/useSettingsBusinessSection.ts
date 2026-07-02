/** @format */

import { useEffect, useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    fetchWorkspacePrinters,
    fetchWorkspaceSettings,
    saveWorkspaceSettings,
} from '../../query/RuntimeQueries';
import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';
import {
    applyTheme,
    loadResolvedTheme,
    resolveThemeFromWorkspaceSettings,
} from '../../runtime/WorkspaceTheme';

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
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [availablePrinters, setAvailablePrinters] = useState<readonly PrinterSummary[]>([]);
    const [message, setMessage] = useState('');
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
    });
    const printersQuery = useQuery({
        queryKey: queryKeys.workspacePrinters(runtimeScope),
        enabled: Boolean(window.vaultBillDesktop?.listPrinters),
        queryFn: fetchWorkspacePrinters,
        staleTime: Number.POSITIVE_INFINITY,
    });
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
            const nextBusiness: SettingsBusinessFormValues = {
                companyName: value.companyName.trim(),
                address: value.address.trim(),
                gstin: value.gstin.trim(),
                theme: value.theme,
                outputTarget: value.outputTarget,
                preferredPrinterName: value.preferredPrinterName.trim(),
                includeDraftsInReports: value.includeDraftsInReports,
            };
            applyTheme(value.theme);
            await saveBusinessMutation.mutateAsync(nextBusiness);
        },
    });
    const saveBusinessMutation = useMutation({
        mutationFn: (nextBusiness: SettingsBusinessFormValues) =>
            saveWorkspaceSettings({
                capabilities,
                settings: nextBusiness,
            }),
        onSuccess: async (_, nextBusiness) => {
            setMessage('Business settings saved.');
            queryClient.setQueryData(queryKeys.workspaceSettings(runtimeScope), nextBusiness);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.workspaceSettings(runtimeScope),
            });
        },
        onError: (reason: unknown) => {
            setMessage(
                reason instanceof Error ? reason.message : 'Business settings could not be saved.',
            );
        },
    });

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb).then((resolvedTheme) => {
            form.setFieldValue('theme', resolvedTheme);
            applyTheme(resolvedTheme);
        });
    }, [capabilities.isHostedWeb, form]);

    useEffect(() => {
        if (!workspaceSettingsQuery.data) return;
        form.reset(workspaceSettingsQuery.data);
        const resolvedTheme = resolveThemeFromWorkspaceSettings(workspaceSettingsQuery.data);
        form.setFieldValue('theme', resolvedTheme);
        applyTheme(resolvedTheme);
    }, [form, workspaceSettingsQuery.data]);

    useEffect(() => {
        if (!workspaceSettingsQuery.isError) return;
        form.reset(defaultWorkspaceSettings);
        const resolvedTheme = resolveThemeFromWorkspaceSettings(defaultWorkspaceSettings);
        form.setFieldValue('theme', resolvedTheme);
        applyTheme(resolvedTheme);
    }, [form, workspaceSettingsQuery.isError]);

    useEffect(() => {
        if (!printersQuery.data) {
            setAvailablePrinters([]);
            return;
        }
        setAvailablePrinters(printersQuery.data);
        const { preferredPrinterName } = form.state.values;
        if (
            preferredPrinterName &&
            !printersQuery.data.some((printer) => printer.name === preferredPrinterName)
        ) {
            form.setFieldValue('preferredPrinterName', '');
            return;
        }
        if (!preferredPrinterName) {
            const { name: defaultPrinter = '' } =
                printersQuery.data.find((printer) => printer.isDefault) ?? {};
            if (defaultPrinter) form.setFieldValue('preferredPrinterName', defaultPrinter);
        }
    }, [form, printersQuery.data]);

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
