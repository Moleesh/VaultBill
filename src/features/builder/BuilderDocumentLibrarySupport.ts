/** @format */

import { builtInStoredFormats } from '../../constants/BuiltInDocumentFormats';
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import type { DocumentFormatConfig } from './BuilderPageControllerSupport';

export type BuilderLibraryConfigMeta = {
    readonly isEnabled?: boolean;
    readonly isFavorite?: boolean;
    readonly sortOrder?: number;
};

export type BuilderInventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly isBuiltIn: boolean;
    readonly isEnabled: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
    readonly sortOrder: number;
};

const builtInFormatIds = new Set(builtInStoredFormats.map((format) => format.formatId));

const normalizeIdRoot = (value: string): string =>
    value
        .trim()
        .replace(/\s+/gu, '')
        .replace(/[^A-Za-z0-9]/gu, '')
        .replace(/^[^A-Za-z]+/u, '') || 'Document';

const uniqueFormatId = (root: string, existingIds: readonly string[]): string => {
    let candidate = root;
    let counter = 2;
    while (existingIds.includes(candidate)) {
        candidate = `${root}${String(counter)}`;
        counter += 1;
    }
    return candidate;
};

const copyName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return 'Document Copy';
    const match = /\sCopy(?:\s(\d+))?$/u.exec(trimmed);
    if (!match) return `${trimmed} Copy`;
    const base = trimmed.slice(0, match.index).trim();
    const nextNumber = Number(match[1] ?? '1') + 1;
    return `${base} Copy ${String(nextNumber)}`;
};

const cloneFormat = (config: DocumentFormatConfig): DocumentFormatConfig =>
    JSON.parse(JSON.stringify(config)) as DocumentFormatConfig;

export const readBuilderLibraryMeta = (config: unknown): Required<BuilderLibraryConfigMeta> => {
    const libraryMeta =
        typeof config === 'object' &&
        config !== null &&
        'LibraryMeta' in config &&
        typeof config.LibraryMeta === 'object' &&
        config.LibraryMeta !== null
            ? (config.LibraryMeta as BuilderLibraryConfigMeta)
            : undefined;

    return {
        isEnabled: libraryMeta?.isEnabled ?? true,
        isFavorite: libraryMeta?.isFavorite ?? false,
        sortOrder: libraryMeta?.sortOrder ?? Number.MAX_SAFE_INTEGER,
    };
};

export const writeBuilderLibraryMeta = (
    config: DocumentFormatConfig,
    nextMeta: BuilderLibraryConfigMeta,
): DocumentFormatConfig => ({
    ...config,
    LibraryMeta: {
        ...readBuilderLibraryMeta(config),
        ...nextMeta,
    },
});

export const isBuiltInBuilderFormat = (formatId: string): boolean => builtInFormatIds.has(formatId);

export const sortBuilderInventory = (
    inventory: readonly BuilderInventoryItem[],
): readonly BuilderInventoryItem[] =>
    [...inventory].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1;
        return left.formatName.localeCompare(right.formatName);
    });

export const createNewDocumentDraft = (existingIds: readonly string[]): DocumentFormatConfig => {
    const draft = cloneFormat(builtInDefaultFormat);
    draft.FormatId = uniqueFormatId(normalizeIdRoot(draft.FormatName), existingIds);
    return writeBuilderLibraryMeta(draft, {
        isEnabled: true,
        isFavorite: false,
        sortOrder: existingIds.length,
    });
};

export const duplicateDocumentDraft = (
    config: DocumentFormatConfig,
    existingIds: readonly string[],
): DocumentFormatConfig => {
    const draft = cloneFormat(config);
    draft.FormatId = uniqueFormatId(normalizeIdRoot(copyName(draft.FormatName)), existingIds);
    draft.FormatName = copyName(draft.FormatName);
    return writeBuilderLibraryMeta(draft, {
        isEnabled: true,
        isFavorite: false,
        sortOrder: existingIds.length,
    });
};

export const describeInventoryItem = (item: BuilderInventoryItem): string =>
    [
        item.isBuiltIn ? 'Built-in document' : 'Custom document',
        `Template: ${item.templateName ?? 'Not linked'}`,
        `${String(item.assetCount)} asset${item.assetCount === 1 ? '' : 's'}`,
        item.isValid ? 'Valid' : 'Needs attention',
    ].join(' • ');
