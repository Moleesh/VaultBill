/** @format */

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    base64ByteLength,
    builtInSampleAsset,
    htmlStorageKey,
    readConfig,
    type AssetSummary,
    type SavedPrintTemplate,
    type StoredBuilderPackage,
} from './BuilderPageSupport';
import {
    defaultSavedPrintTemplates,
    normalizeSavedPrintTemplates,
} from './BuilderSavedTemplatesSupport';
import type { DocumentFormatConfig } from './BuilderPageControllerSupport';
import type { BuilderInventoryItem } from './BuilderDocumentLibrarySupport';

type BuilderDocumentLibrarySetters = {
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setTemplateHtml: (value: string) => void;
    readonly setViewMode: (value: 'library' | 'builder') => void;
};

type BuilderDocumentLibraryContext = BuilderDocumentLibrarySetters & {
    readonly capabilities: Pick<CapabilityRegistry, 'isLanBrowser'>;
};

const applyStoredBuilderPackage = (
    stored: StoredBuilderPackage | undefined,
    setters: BuilderDocumentLibrarySetters,
): boolean => {
    if (!stored) return false;
    const parsedConfig = DocumentFormatConfigSchema.parse(stored.config) as DocumentFormatConfig;
    setters.setConfig(parsedConfig);
    setters.setTemplateHtml(stored.templateHtml);
    setters.setSavedTemplates(
        normalizeSavedPrintTemplates(stored.savedTemplates ?? defaultSavedPrintTemplates()),
    );
    setters.setAssets(
        stored.assets.map((asset) => ({
            ...asset,
            size: base64ByteLength(asset.dataBase64),
        })),
    );
    return true;
};

export const loadBuilderPackage = async ({
    capabilities,
    formatId,
}: Pick<BuilderDocumentLibraryContext, 'capabilities'> & {
    readonly formatId: string | undefined;
}) => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.loadBuilderPackage(formatId);
    }
    if (capabilities.isLanBrowser) {
        const query = formatId ? `?formatId=${encodeURIComponent(formatId)}` : '';
        return requestHostedApi<StoredBuilderPackage | undefined>(`/builder/package${query}`);
    }

    return {
        config: readConfig(),
        templateHtml:
            window.localStorage.getItem(htmlStorageKey) ?? builtInDefaultPrintTemplateHtml,
        assets: [builtInSampleAsset],
    } satisfies StoredBuilderPackage;
};

export const loadBuilderInventory = async ({
    capabilities,
}: Pick<BuilderDocumentLibraryContext, 'capabilities'>): Promise<
    readonly BuilderInventoryItem[]
> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.listBuilderInventory();
    }
    if (capabilities.isLanBrowser) {
        return requestHostedApi<readonly BuilderInventoryItem[]>('/builder/inventory');
    }
    return [];
};

export const loadAndApplyBuilderPackage = async ({
    capabilities,
    formatId,
    setters,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isLanBrowser'>;
    readonly formatId: string | undefined;
    readonly setters: BuilderDocumentLibrarySetters;
}) => applyStoredBuilderPackage(await loadBuilderPackage({ capabilities, formatId }), setters);

export const refreshBuilderInventory = async (
    capabilities: Pick<CapabilityRegistry, 'isLanBrowser'>,
): Promise<readonly BuilderInventoryItem[]> => loadBuilderInventory({ capabilities });
