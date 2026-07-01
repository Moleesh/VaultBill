/** @format */
/* eslint-disable max-lines */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchBuilderInventory, fetchBuilderPackage } from '../../query/RuntimeQueries';
import {
    base64ByteLength,
    builtInSampleAsset,
    type AssetSummary,
    type SavedPrintTemplate,
    type StoredBuilderPackage,
} from './BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    normalizeSavedPrintTemplates,
} from './BuilderSavedTemplatesSupport';
import type { DocumentFormatConfig } from './BuilderPageControllerSupport';
import {
    createNewDocumentDraft,
    duplicateDocumentDraft,
    type BuilderInventoryItem,
} from './BuilderDocumentLibrarySupport';
import { applyStoredBuilderPackage, deleteBuilderPackage } from './BuilderDocumentLibraryRuntime';

type BuilderDocumentLibraryArgs = {
    readonly assets: readonly AssetSummary[];
    readonly capabilities: Pick<CapabilityRegistry, 'isDesktop' | 'isDemoMode' | 'isHostedWeb'>;
    readonly config: DocumentFormatConfig;
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setTemplateHtml: (value: string) => void;
    readonly setViewMode: (value: 'library' | 'builder') => void;
    readonly templateHtml: string;
};

/** Loads the builder document inventory and switchable draft package. */
export const useBuilderDocumentLibrary = ({
    assets,
    capabilities,
    config,
    savedTemplates,
    setAssets,
    setConfig,
    setMessage,
    setSavedTemplates,
    setTemplateHtml,
    setViewMode,
    templateHtml,
}: BuilderDocumentLibraryArgs) => {
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedFormatId = searchParams.get('format') ?? undefined;
    const inventoryQuery = useQuery({
        queryKey: queryKeys.builderInventory(runtimeScope),
        queryFn: () => fetchBuilderInventory({ capabilities }),
    });
    const requestedPackageQuery = useQuery({
        queryKey: queryKeys.builderPackage(runtimeScope, requestedFormatId ?? '__current__'),
        queryFn: () => fetchBuilderPackage({ capabilities, formatId: requestedFormatId }),
    });
    const deletePackageMutation = useMutation({
        mutationFn: (formatId: string) => deleteBuilderPackage({ capabilities, formatId }),
        onSuccess: async (_, formatId) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.builderInventory(runtimeScope),
            });
            queryClient.removeQueries({
                queryKey: queryKeys.builderPackage(runtimeScope, formatId),
            });
        },
    });
    const inventory = useMemo(() => inventoryQuery.data ?? [], [inventoryQuery.data]);

    const normalizeLoadedAssets = useCallback(
        (loadedPackage: StoredBuilderPackage): readonly AssetSummary[] =>
            loadedPackage.assets.map((asset) => ({
                ...asset,
                size: base64ByteLength(asset.dataBase64),
            })),
        [],
    );

    const syncFormatSearchParam = useCallback(
        (formatId?: string) => {
            setSearchParams((current) => {
                const next = new URLSearchParams(current);
                if (formatId) next.set('format', formatId);
                else next.delete('format');
                return next;
            });
        },
        [setSearchParams],
    );

    const loadDocument = useCallback(
        async (
            formatId?: string,
            options?: {
                readonly openBuilder?: boolean;
                readonly syncSearchParam?: boolean;
            },
        ) => {
            const shouldOpenBuilder = options?.openBuilder ?? Boolean(formatId);
            const shouldSyncSearchParam = options?.syncSearchParam ?? shouldOpenBuilder;
            const loaded = await queryClient.fetchQuery({
                queryKey: queryKeys.builderPackage(runtimeScope, formatId ?? '__current__'),
                queryFn: () => fetchBuilderPackage({ capabilities, formatId }),
            });
            const applied = applyStoredBuilderPackage(loaded, {
                setAssets,
                setConfig,
                setMessage,
                setSavedTemplates,
                setTemplateHtml,
                setViewMode,
            });
            if (!applied) {
                setMessage('The selected document could not be loaded.');
                return;
            }
            if (shouldOpenBuilder) setViewMode('builder');
            if (shouldSyncSearchParam) syncFormatSearchParam(formatId);
            setMessage('');
        },
        [
            capabilities,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setTemplateHtml,
            setViewMode,
            syncFormatSearchParam,
            queryClient,
            runtimeScope,
        ],
    );

    const refreshInventory = useCallback(async (): Promise<readonly BuilderInventoryItem[]> => {
        const nextInventory = await queryClient.fetchQuery({
            queryKey: queryKeys.builderInventory(runtimeScope),
            queryFn: () => fetchBuilderInventory({ capabilities }),
        });
        return nextInventory;
    }, [capabilities, queryClient, runtimeScope]);

    useEffect(() => {
        if (!requestedPackageQuery.data) return;
        const applied = applyStoredBuilderPackage(requestedPackageQuery.data, {
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setTemplateHtml,
            setViewMode,
        });
        if (!applied) {
            setMessage('The selected document could not be loaded.');
            return;
        }
        if (requestedFormatId) setViewMode('builder');
        setMessage('');
    }, [
        requestedFormatId,
        requestedPackageQuery.data,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setTemplateHtml,
        setViewMode,
    ]);

    useEffect(() => {
        if (!requestedPackageQuery.isError) return;
        setMessage('Builder data could not be loaded.');
    }, [requestedPackageQuery.isError, setMessage]);

    const createNewDocument = useCallback(() => {
        const nextConfig = createNewDocumentDraft(inventory.map((item) => item.formatId));
        setConfig(nextConfig);
        setTemplateHtml(builtInDefaultPrintTemplateHtml);
        setSavedTemplates(defaultSavedPrintTemplates());
        setAssets([builtInSampleAsset]);
        setMessage('A new document draft is ready. Publish it when it looks right.');
        setViewMode('builder');
        syncFormatSearchParam(nextConfig.FormatId);
    }, [
        inventory,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setTemplateHtml,
        setViewMode,
        syncFormatSearchParam,
    ]);

    const duplicateCurrentDocument = useCallback(() => {
        const nextConfig = duplicateDocumentDraft(
            config,
            inventory.map((item) => item.formatId),
        );
        setConfig(nextConfig);
        setSavedTemplates(normalizeSavedPrintTemplates(savedTemplates));
        setMessage(`Copied ${config.FormatName}. Publish the new document to save it.`);
        setViewMode('builder');
        syncFormatSearchParam(nextConfig.FormatId);
    }, [
        config,
        inventory,
        savedTemplates,
        setConfig,
        setMessage,
        setSavedTemplates,
        setViewMode,
        syncFormatSearchParam,
    ]);

    const duplicateDocument = useCallback(
        async (formatId: string) => {
            const sourcePackage =
                formatId === config.FormatId
                    ? {
                          config,
                          templateHtml,
                          savedTemplates,
                          assets,
                      }
                    : await queryClient.fetchQuery({
                          queryKey: queryKeys.builderPackage(runtimeScope, formatId),
                          queryFn: () => fetchBuilderPackage({ capabilities, formatId }),
                      });

            if (!sourcePackage) {
                setMessage('The selected document could not be duplicated.');
                return;
            }

            const nextConfig = duplicateDocumentDraft(
                sourcePackage.config as DocumentFormatConfig,
                inventory.map((item) => item.formatId),
            );

            setConfig(nextConfig);
            setTemplateHtml(sourcePackage.templateHtml);
            setSavedTemplates(
                normalizeSavedPrintTemplates(
                    sourcePackage.savedTemplates ?? defaultSavedPrintTemplates(),
                ),
            );
            setAssets(normalizeLoadedAssets(sourcePackage));
            setMessage(
                `Copied ${(sourcePackage.config as DocumentFormatConfig).FormatName}. Publish the new document to save it.`,
            );
            setViewMode('builder');
            syncFormatSearchParam(nextConfig.FormatId);
        },
        [
            assets,
            capabilities,
            config,
            inventory,
            normalizeLoadedAssets,
            queryClient,
            runtimeScope,
            savedTemplates,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setTemplateHtml,
            setViewMode,
            syncFormatSearchParam,
            templateHtml,
        ],
    );

    const deleteDocument = useCallback(
        async (item: BuilderInventoryItem) => {
            if (item.isDefault) {
                setMessage('The default document stays in the library.');
                return;
            }
            const confirmed = window.confirm(
                `Delete "${item.formatName}" from the document library?`,
            );
            if (!confirmed) return;

            await deletePackageMutation.mutateAsync(item.formatId);
            const nextInventory = await refreshInventory();

            if (item.formatId === config.FormatId) {
                const fallbackFormatId = nextInventory[0]?.formatId;
                if (fallbackFormatId) {
                    await loadDocument(fallbackFormatId, {
                        openBuilder: false,
                        syncSearchParam: false,
                    });
                }
                setViewMode('library');
                syncFormatSearchParam(undefined);
            }

            setMessage(`Deleted ${item.formatName}.`);
        },
        [
            config.FormatId,
            loadDocument,
            refreshInventory,
            setMessage,
            setViewMode,
            syncFormatSearchParam,
            deletePackageMutation,
        ],
    );

    return {
        createNewDocument,
        deleteDocument,
        duplicateDocument,
        duplicateCurrentDocument,
        inventory,
        loadDocument,
        refreshInventory,
    };
};
