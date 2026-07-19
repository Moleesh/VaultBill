/** @format */
/* eslint-disable max-lines */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    fetchBuilderInventory,
    fetchBuilderPackage,
    saveBuilderPackage,
} from '../../query/RuntimeQueries';
import { applyStoredBuilderPackage, deleteBuilderPackage } from './BuilderDocumentLibraryRuntime';
import {
    duplicateDocumentDraft,
    readBuilderLibraryMeta,
    sortBuilderInventory,
    writeBuilderLibraryMeta,
    type BuilderInventoryItem,
} from './BuilderDocumentLibrarySupport';
import type { DocumentFormatConfig } from './BuilderPageControllerSupport';
import { renderBuilderPreview } from './BuilderPagePreviewSupport';
import {
    base64ByteLength,
    builtInSampleAsset,
    normalizePrintSettings,
    steps,
    type AssetSummary,
    type SavedPrintTemplate,
    type StoredBuilderPackage,
} from './BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    normalizeSavedPrintTemplates,
} from './BuilderSavedTemplatesSupport';

type BuilderDocumentLibraryArgs = {
    readonly assets: readonly AssetSummary[];
    readonly capabilities: Pick<CapabilityRegistry, 'isDesktop' | 'isDemoMode' | 'isHostedWeb'>;
    readonly config: DocumentFormatConfig;
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setStepIndex: (value: number) => void;
    readonly setTemplateHtml: (value: string) => void;
    readonly setViewMode: (value: 'library' | 'builder') => void;
    readonly templateHtml: string;
};

type BuilderFieldPreviewPackage = Omit<StoredBuilderPackage, 'assets' | 'config'> & {
    readonly assets: readonly AssetSummary[];
    readonly config: DocumentFormatConfig;
};

type BuilderPrintPreviewPackage = BuilderFieldPreviewPackage;

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
    setStepIndex,
    setTemplateHtml,
    setViewMode,
    templateHtml,
}: BuilderDocumentLibraryArgs) => {
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [searchParams, setSearchParams] = useSearchParams();
    const [fieldPreviewPackage, setFieldPreviewPackage] = useState<BuilderFieldPreviewPackage>();
    const [printPreviewPackage, setPrintPreviewPackage] = useState<BuilderPrintPreviewPackage>();
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
            await queryClient.invalidateQueries({
                queryKey: queryKeys.publishedFormats(runtimeScope),
            });
            queryClient.removeQueries({
                queryKey: queryKeys.builderPackage(runtimeScope, formatId),
            });
        },
    });
    const inventory = useMemo(
        () => sortBuilderInventory(inventoryQuery.data ?? []),
        [inventoryQuery.data],
    );

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
    const requestedStepIndex = useCallback(
        () => (searchParams.get('step') === 'preview' ? steps.length - 1 : 0),
        [searchParams],
    );

    const loadDocument = useCallback(
        async (
            formatId?: string,
            options?: {
                readonly openBuilder?: boolean;
                readonly stepIndex?: number;
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
            if (shouldOpenBuilder) {
                setViewMode('builder');
                setStepIndex(options?.stepIndex ?? 0);
            }
            if (shouldSyncSearchParam) syncFormatSearchParam(formatId);
            setMessage('');
        },
        [
            capabilities,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setStepIndex,
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

    const updateInventoryCache = useCallback(
        (updateItem: (item: BuilderInventoryItem) => BuilderInventoryItem) => {
            queryClient.setQueryData<readonly BuilderInventoryItem[]>(
                queryKeys.builderInventory(runtimeScope),
                (currentInventory) => currentInventory?.map(updateItem) ?? currentInventory,
            );
        },
        [queryClient, runtimeScope],
    );

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
        if (requestedFormatId) {
            setViewMode('builder');
            setStepIndex(requestedStepIndex());
        }
        setMessage('');
    }, [
        requestedFormatId,
        requestedPackageQuery.data,
        requestedStepIndex,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setStepIndex,
        setTemplateHtml,
        setViewMode,
    ]);

    useEffect(() => {
        if (!requestedPackageQuery.isError) return;
        setMessage('Builder data could not be loaded.');
    }, [requestedPackageQuery.isError, setMessage]);

    const duplicateCurrentDocument = useCallback(() => {
        const nextConfig = duplicateDocumentDraft(
            config,
            inventory.map((item) => item.formatId),
        );
        setConfig(nextConfig);
        setSavedTemplates(normalizeSavedPrintTemplates(savedTemplates));
        setMessage(`Copied ${config.FormatName}. Publish the new document to save it.`);
        setViewMode('builder');
        setStepIndex(requestedStepIndex());
        syncFormatSearchParam(nextConfig.FormatId);
    }, [
        config,
        inventory,
        requestedStepIndex,
        savedTemplates,
        setConfig,
        setMessage,
        setSavedTemplates,
        setStepIndex,
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
            setStepIndex(requestedStepIndex());
            syncFormatSearchParam(nextConfig.FormatId);
        },
        [
            assets,
            capabilities,
            config,
            inventory,
            normalizeLoadedAssets,
            queryClient,
            requestedStepIndex,
            runtimeScope,
            savedTemplates,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setStepIndex,
            setTemplateHtml,
            setViewMode,
            syncFormatSearchParam,
            templateHtml,
        ],
    );

    const createNewDocument = useCallback(async () => {
        const defaultDocument = inventory.find((item) => item.isDefault) ?? inventory[0];
        if (!defaultDocument) {
            const nextConfig = duplicateDocumentDraft(
                config,
                inventory.map((item) => item.formatId),
            );
            setConfig(nextConfig);
            setSavedTemplates(defaultSavedPrintTemplates());
            setAssets([builtInSampleAsset]);
            setMessage('A new document draft is ready. Publish it when it looks right.');
            setViewMode('builder');
            setStepIndex(requestedStepIndex());
            syncFormatSearchParam(nextConfig.FormatId);
            return;
        }
        await duplicateDocument(defaultDocument.formatId);
    }, [
        config,
        duplicateDocument,
        inventory,
        requestedStepIndex,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setStepIndex,
        setViewMode,
        syncFormatSearchParam,
    ]);

    const persistDocumentPackage = useCallback(
        async (builderPackage: StoredBuilderPackage) => {
            const normalizedPackage = {
                config: builderPackage.config as DocumentFormatConfig,
                templateHtml: builderPackage.templateHtml,
                savedTemplates: normalizeSavedPrintTemplates(
                    builderPackage.savedTemplates ?? defaultSavedPrintTemplates(),
                ),
                assets: normalizeLoadedAssets(builderPackage),
            };
            await saveBuilderPackage({
                capabilities,
                config: normalizedPackage.config,
                templateHtml: normalizedPackage.templateHtml,
                savedTemplates: normalizedPackage.savedTemplates,
                assets: normalizedPackage.assets,
            });
            queryClient.setQueryData(
                queryKeys.builderPackage(runtimeScope, normalizedPackage.config.FormatId),
                normalizedPackage,
            );
            await queryClient.invalidateQueries({
                queryKey: queryKeys.builderInventory(runtimeScope),
            });
            await queryClient.invalidateQueries({
                queryKey: queryKeys.publishedFormats(runtimeScope),
            });
            return normalizedPackage;
        },
        [capabilities, normalizeLoadedAssets, queryClient, runtimeScope],
    );

    const fetchDocumentPackage = useCallback(
        async (formatId: string): Promise<StoredBuilderPackage | null> => {
            if (formatId === config.FormatId) {
                return {
                    config,
                    templateHtml,
                    savedTemplates,
                    assets,
                };
            }
            return (
                (await queryClient.fetchQuery({
                    queryKey: queryKeys.builderPackage(runtimeScope, formatId),
                    queryFn: () => fetchBuilderPackage({ capabilities, formatId }),
                })) ?? null
            );
        },
        [assets, capabilities, config, queryClient, runtimeScope, savedTemplates, templateHtml],
    );

    const setDefaultDocument = useCallback(
        async (item: BuilderInventoryItem) => {
            const sourcePackage = await fetchDocumentPackage(item.formatId);
            if (!sourcePackage) {
                setMessage('The selected document could not be updated.');
                return;
            }
            updateInventoryCache((currentItem) => ({
                ...currentItem,
                isDefault: currentItem.formatId === item.formatId,
                isEnabled: currentItem.formatId === item.formatId ? true : currentItem.isEnabled,
            }));
            try {
                for (const currentItem of inventory) {
                    if (!currentItem.isDefault || currentItem.formatId === item.formatId) continue;
                    const currentPackage = await fetchDocumentPackage(currentItem.formatId);
                    if (!currentPackage) continue;
                    const currentMeta = readBuilderLibraryMeta(currentPackage.config);
                    const savedCurrentPackage = await persistDocumentPackage({
                        ...currentPackage,
                        config: writeBuilderLibraryMeta(
                            currentPackage.config as DocumentFormatConfig,
                            {
                                isEnabled: currentMeta.isEnabled,
                                isFavorite: false,
                                sortOrder: currentItem.sortOrder,
                            },
                        ),
                    });
                    if (currentItem.formatId === config.FormatId) {
                        setConfig(savedCurrentPackage.config);
                    }
                }
                const nextConfig = writeBuilderLibraryMeta(
                    sourcePackage.config as DocumentFormatConfig,
                    {
                        isEnabled: true,
                        isFavorite: true,
                        sortOrder: item.sortOrder,
                    },
                );
                const savedPackage = await persistDocumentPackage({
                    ...sourcePackage,
                    config: nextConfig,
                });
                if (item.formatId === config.FormatId) {
                    setConfig(savedPackage.config);
                }
                await refreshInventory();
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.publishedFormats(runtimeScope),
                });
                setMessage(`${item.formatName} is now the default document.`);
            } catch {
                setMessage(
                    `${item.formatName} is default here, but VaultBill could not save it while the workspace is read-only.`,
                );
            }
        },
        [
            config.FormatId,
            fetchDocumentPackage,
            inventory,
            persistDocumentPackage,
            queryClient,
            refreshInventory,
            runtimeScope,
            setConfig,
            setMessage,
            updateInventoryCache,
        ],
    );

    const setDocumentEnabled = useCallback(
        async (item: BuilderInventoryItem, isEnabled: boolean) => {
            if (item.isDefault) {
                setMessage('The default document must stay enabled.');
                return;
            }
            const sourcePackage = await fetchDocumentPackage(item.formatId);
            if (!sourcePackage) {
                setMessage('The selected document could not be updated.');
                return;
            }
            updateInventoryCache((currentItem) =>
                currentItem.formatId === item.formatId
                    ? {
                          ...currentItem,
                          isEnabled,
                      }
                    : currentItem,
            );
            try {
                const nextConfig = writeBuilderLibraryMeta(
                    sourcePackage.config as DocumentFormatConfig,
                    {
                        isEnabled,
                        isFavorite: false,
                        sortOrder: item.sortOrder,
                    },
                );
                const savedPackage = await persistDocumentPackage({
                    ...sourcePackage,
                    config: nextConfig,
                });
                if (item.formatId === config.FormatId) {
                    setConfig(savedPackage.config);
                }
                await refreshInventory();
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.publishedFormats(runtimeScope),
                });
                setMessage(
                    isEnabled
                        ? `${item.formatName} is enabled.`
                        : `${item.formatName} is disabled.`,
                );
            } catch {
                setMessage(
                    `${item.formatName} is ${isEnabled ? 'enabled' : 'disabled'} here, but VaultBill could not save it while the workspace is read-only.`,
                );
            }
        },
        [
            config.FormatId,
            fetchDocumentPackage,
            persistDocumentPackage,
            queryClient,
            refreshInventory,
            runtimeScope,
            setConfig,
            setMessage,
            updateInventoryCache,
        ],
    );

    const reorderDocuments = useCallback(
        async (
            draggedFormatId: string,
            targetFormatId: string,
            placement: 'before' | 'after' = 'before',
        ) => {
            if (!draggedFormatId || draggedFormatId === targetFormatId) return;
            const fromIndex = inventory.findIndex((item) => item.formatId === draggedFormatId);
            const toIndex = inventory.findIndex((item) => item.formatId === targetFormatId);
            if (fromIndex < 0 || toIndex < 0) return;
            const nextInventory = [...inventory];
            const [movedItem] = nextInventory.splice(fromIndex, 1);
            if (!movedItem) return;
            const targetIndex = nextInventory.findIndex((item) => item.formatId === targetFormatId);
            if (targetIndex < 0) return;
            nextInventory.splice(
                placement === 'after' ? targetIndex + 1 : targetIndex,
                0,
                movedItem,
            );
            const orderedInventory = nextInventory.map((item, index) => ({
                ...item,
                sortOrder: index,
            }));

            queryClient.setQueryData(queryKeys.builderInventory(runtimeScope), orderedInventory);

            try {
                for (const [index, item] of orderedInventory.entries()) {
                    const sourcePackage = await fetchDocumentPackage(item.formatId);
                    if (!sourcePackage) continue;
                    const nextConfig = writeBuilderLibraryMeta(
                        sourcePackage.config as DocumentFormatConfig,
                        {
                            isEnabled: readBuilderLibraryMeta(sourcePackage.config).isEnabled,
                            isFavorite: item.isDefault,
                            sortOrder: index,
                        },
                    );
                    const savedPackage = await persistDocumentPackage({
                        ...sourcePackage,
                        config: nextConfig,
                    });
                    if (item.formatId === config.FormatId) {
                        setConfig(savedPackage.config);
                    }
                }
                await refreshInventory();
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.publishedFormats(runtimeScope),
                });
                setMessage('Document order updated.');
            } catch {
                setMessage(
                    'Document order changed here, but VaultBill could not save it while the workspace is read-only.',
                );
            }
        },
        [
            config.FormatId,
            fetchDocumentPackage,
            inventory,
            persistDocumentPackage,
            queryClient,
            refreshInventory,
            runtimeScope,
            setConfig,
            setMessage,
        ],
    );

    const openDocumentAtStep = useCallback(
        async (formatId: string, stepIndex: number) => {
            await loadDocument(formatId, {
                openBuilder: true,
                stepIndex,
                syncSearchParam: true,
            });
        },
        [loadDocument],
    );

    const testPrintDocument = useCallback(
        async (formatId: string) => {
            const sourcePackage = await fetchDocumentPackage(formatId);
            if (!sourcePackage) {
                setMessage('The selected document could not be printed.');
                return;
            }
            const previewHtml = renderBuilderPreview(
                sourcePackage.templateHtml,
                sourcePackage.config as DocumentFormatConfig,
                normalizeLoadedAssets(sourcePackage),
                normalizePrintSettings((sourcePackage.config as DocumentFormatConfig).Print),
            );
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.srcdoc = previewHtml;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                window.setTimeout(() => {
                    iframe.remove();
                }, 1000);
            };
            setMessage(`Printing ${(sourcePackage.config as DocumentFormatConfig).FormatName}.`);
        },
        [fetchDocumentPackage, normalizeLoadedAssets, setMessage],
    );

    const openFieldPreview = useCallback(
        async (formatId: string) => {
            const sourcePackage = await fetchDocumentPackage(formatId);
            if (!sourcePackage) {
                setMessage('The selected document preview could not be loaded.');
                return;
            }
            setFieldPreviewPackage({
                ...sourcePackage,
                assets: normalizeLoadedAssets(sourcePackage),
                config: sourcePackage.config as DocumentFormatConfig,
            });
            setMessage('');
        },
        [fetchDocumentPackage, normalizeLoadedAssets, setMessage],
    );

    const openPrintPreview = useCallback(
        async (formatId: string) => {
            const sourcePackage = await fetchDocumentPackage(formatId);
            if (!sourcePackage) {
                setMessage('The selected print preview could not be loaded.');
                return;
            }
            const sourceConfig = sourcePackage.config as DocumentFormatConfig;
            setPrintPreviewPackage({
                ...sourcePackage,
                assets: normalizeLoadedAssets(sourcePackage),
                config: {
                    ...sourceConfig,
                    Print: normalizePrintSettings(sourceConfig.Print),
                },
            });
            setMessage('');
        },
        [fetchDocumentPackage, normalizeLoadedAssets, setMessage],
    );

    const deleteDocument = useCallback(
        async (item: BuilderInventoryItem) => {
            if (item.isDefault || item.isBuiltIn) {
                setMessage('This document stays in the library.');
                return;
            }
            if (
                item.isEnabled &&
                inventory.filter((candidate) => candidate.isEnabled).length <= 1
            ) {
                setMessage('Keep at least one document enabled.');
                return;
            }
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
            inventory,
        ],
    );

    return {
        createNewDocument,
        deleteDocument,
        duplicateDocument,
        duplicateCurrentDocument,
        fieldPreviewPackage,
        printPreviewPackage,
        inventory,
        loadDocument,
        closeFieldPreview: () => {
            setFieldPreviewPackage(undefined);
        },
        closePrintPreview: () => {
            setPrintPreviewPackage(undefined);
        },
        openFieldPreview,
        openPrintPreview,
        setPrintPreviewPackage,
        openDocumentAtStep,
        refreshInventory,
        reorderDocuments,
        setDefaultDocument,
        setDocumentEnabled,
        testPrintDocument,
    };
};
