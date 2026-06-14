/** @format */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    base64ByteLength,
    builtInSampleAsset,
    htmlStorageKey,
    readConfig,
    savedTemplatesStorageKey,
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

type BuilderDocumentLibraryArgs = {
    readonly capabilities: Pick<CapabilityRegistry, 'isLanBrowser'>;
    readonly config: DocumentFormatConfig;
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setTemplateHtml: (value: string) => void;
};

/** Loads the builder document inventory and switchable draft package. */
export const useBuilderDocumentLibrary = ({
    capabilities,
    config,
    savedTemplates,
    setAssets,
    setConfig,
    setMessage,
    setSavedTemplates,
    setTemplateHtml,
}: BuilderDocumentLibraryArgs) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedFormatId = searchParams.get('format') ?? undefined;
    const [inventory, setInventory] = useState<readonly BuilderInventoryItem[]>([]);

    const applyPackage = useCallback(
        (stored: StoredBuilderPackage | undefined) => {
            if (!stored) return false;
            const parsedConfig = DocumentFormatConfigSchema.parse(
                stored.config,
            ) as DocumentFormatConfig;
            setConfig(parsedConfig);
            setTemplateHtml(stored.templateHtml);
            setSavedTemplates(
                normalizeSavedPrintTemplates(stored.savedTemplates ?? defaultSavedPrintTemplates()),
            );
            setAssets(
                stored.assets.map((asset) => ({
                    ...asset,
                    size: base64ByteLength(asset.dataBase64),
                })),
            );
            return true;
        },
        [setAssets, setConfig, setSavedTemplates, setTemplateHtml],
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
        async (formatId?: string) => {
            if (window.vaultBillDesktop) {
                const loaded = await window.vaultBillDesktop.loadBuilderPackage(formatId);
                if (!applyPackage(loaded)) {
                    setMessage('The selected document could not be loaded.');
                    return;
                }
            } else if (capabilities.isLanBrowser) {
                const query = formatId ? `?formatId=${encodeURIComponent(formatId)}` : '';
                const loaded = await requestHostedApi<StoredBuilderPackage | undefined>(
                    `/builder/package${query}`,
                );
                if (!applyPackage(loaded)) {
                    setMessage('The selected document could not be loaded.');
                    return;
                }
            } else {
                setConfig(readConfig());
                setTemplateHtml(
                    window.localStorage.getItem(htmlStorageKey) ?? builtInDefaultPrintTemplateHtml,
                );
                let storedSavedTemplates: unknown = null;
                try {
                    storedSavedTemplates = JSON.parse(
                        window.localStorage.getItem(savedTemplatesStorageKey) ?? 'null',
                    ) as unknown;
                } catch {
                    storedSavedTemplates = null;
                }
                setSavedTemplates(
                    normalizeSavedPrintTemplates(storedSavedTemplates),
                );
                setAssets([builtInSampleAsset]);
            }
            if (window.vaultBillDesktop || capabilities.isLanBrowser) {
                syncFormatSearchParam(formatId);
            } else {
                syncFormatSearchParam(undefined);
            }
            setMessage('');
        },
        [
            applyPackage,
            capabilities.isLanBrowser,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setTemplateHtml,
            syncFormatSearchParam,
        ],
    );

    const refreshInventory = useCallback(async () => {
        try {
            if (window.vaultBillDesktop) {
                setInventory(await window.vaultBillDesktop.listBuilderInventory());
            } else if (capabilities.isLanBrowser) {
                setInventory(await requestHostedApi<readonly BuilderInventoryItem[]>(
                    '/builder/inventory',
                ));
            } else {
                setInventory([]);
            }
        } catch {
            setInventory([]);
        }
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        void loadDocument(requestedFormatId).catch((reason: unknown) => {
            setMessage(
                reason instanceof Error ? reason.message : 'Builder data could not be loaded.',
            );
        });
        void refreshInventory();
    }, [loadDocument, refreshInventory, requestedFormatId, setMessage]);

    const createNewDocument = useCallback(() => {
        const nextConfig = createNewDocumentDraft(inventory.map((item) => item.formatId));
        setConfig(nextConfig);
        setTemplateHtml(builtInDefaultPrintTemplateHtml);
        setSavedTemplates(defaultSavedPrintTemplates());
        setAssets([builtInSampleAsset]);
        setMessage('A new document draft is ready. Publish it when it looks right.');
        syncFormatSearchParam(nextConfig.FormatId);
    }, [
        inventory,
        setAssets,
        setConfig,
        setMessage,
        setSavedTemplates,
        setTemplateHtml,
        syncFormatSearchParam,
    ]);

    const duplicateCurrentDocument = useCallback(() => {
        const nextConfig = duplicateDocumentDraft(config, inventory.map((item) => item.formatId));
        setConfig(nextConfig);
        setSavedTemplates(normalizeSavedPrintTemplates(savedTemplates));
        setMessage(`Copied ${config.FormatName}. Publish the new document to save it.`);
        syncFormatSearchParam(nextConfig.FormatId);
    }, [config, inventory, savedTemplates, setConfig, setMessage, setSavedTemplates, syncFormatSearchParam]);

    return {
        createNewDocument,
        duplicateCurrentDocument,
        inventory,
        loadDocument,
        refreshInventory,
    };
};
