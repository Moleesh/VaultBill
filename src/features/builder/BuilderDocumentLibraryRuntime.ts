/** @format */

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import {
    base64ByteLength,
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
    fetchBuilderInventory,
    fetchBuilderPackage,
    removeBuilderPackage,
} from '../../query/RuntimeQueries';
import type { BuilderInventoryItem } from './BuilderDocumentLibrarySupport';

export type BuilderDocumentLibrarySetters = {
    readonly setAssets: (value: readonly AssetSummary[]) => void;
    readonly setConfig: (value: DocumentFormatConfig) => void;
    readonly setMessage: (value: string) => void;
    readonly setSavedTemplates: (value: readonly SavedPrintTemplate[]) => void;
    readonly setTemplateHtml: (value: string) => void;
    readonly setViewMode: (value: 'library' | 'builder') => void;
};

type BuilderDocumentLibraryContext = BuilderDocumentLibrarySetters & {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
};

export const applyStoredBuilderPackage = (
    stored: StoredBuilderPackage | null | undefined,
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

export const loadAndApplyBuilderPackage = async ({
    capabilities,
    formatId,
    setters,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly formatId: string | undefined;
    readonly setters: BuilderDocumentLibrarySetters;
}) => applyStoredBuilderPackage(await fetchBuilderPackage({ capabilities, formatId }), setters);

export const refreshBuilderInventory = async (
    capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>,
): Promise<readonly BuilderInventoryItem[]> => fetchBuilderInventory({ capabilities });

export const deleteBuilderPackage = async ({
    capabilities,
    formatId,
}: Pick<BuilderDocumentLibraryContext, 'capabilities'> & {
    readonly formatId: string;
}): Promise<void> => removeBuilderPackage({ capabilities, formatId });
