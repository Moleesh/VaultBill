/** @format */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import {
    builtInSampleAsset,
    type AssetSummary,
    type SavedPrintTemplate,
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
import {
    loadAndApplyBuilderPackage,
    refreshBuilderInventory,
} from './BuilderDocumentLibraryRuntime';

type BuilderDocumentLibraryArgs = {
    readonly capabilities: Pick<CapabilityRegistry, 'isLanBrowser'>;
    readonly config: DocumentFormatConfig;
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setTemplateHtml: (value: string) => void;
    readonly setViewMode: (value: 'library' | 'builder') => void;
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
    setViewMode,
}: BuilderDocumentLibraryArgs) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedFormatId = searchParams.get('format') ?? undefined;
    const [inventory, setInventory] = useState<readonly BuilderInventoryItem[]>([]);

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
            const shouldOpenBuilder = Boolean(formatId);
            const loaded = await loadAndApplyBuilderPackage({
                capabilities: { isLanBrowser: capabilities.isLanBrowser },
                formatId,
                setters: {
                    setAssets,
                    setConfig,
                    setMessage,
                    setSavedTemplates,
                    setTemplateHtml,
                    setViewMode,
                },
            });
            if (!loaded) {
                setMessage('The selected document could not be loaded.');
                return;
            }
            if (shouldOpenBuilder) setViewMode('builder');
            syncFormatSearchParam(formatId);
            setMessage('');
        },
        [
            capabilities.isLanBrowser,
            setAssets,
            setConfig,
            setMessage,
            setSavedTemplates,
            setTemplateHtml,
            setViewMode,
            syncFormatSearchParam,
        ],
    );

    const refreshInventory = useCallback(async () => {
        try {
            setInventory(
                await refreshBuilderInventory({ isLanBrowser: capabilities.isLanBrowser }),
            );
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

    return {
        createNewDocument,
        duplicateCurrentDocument,
        inventory,
        loadDocument,
        refreshInventory,
    };
};
