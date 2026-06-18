/** @format */

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import type { DocumentFormatConfig } from './BuilderPageControllerSupport';

export type BuilderInventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

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

export const createNewDocumentDraft = (existingIds: readonly string[]): DocumentFormatConfig => {
    const draft = cloneFormat(builtInDefaultFormat);
    draft.FormatId = uniqueFormatId(normalizeIdRoot(draft.FormatName), existingIds);
    return draft;
};

export const duplicateDocumentDraft = (
    config: DocumentFormatConfig,
    existingIds: readonly string[],
): DocumentFormatConfig => {
    const draft = cloneFormat(config);
    draft.FormatId = uniqueFormatId(normalizeIdRoot(copyName(draft.FormatName)), existingIds);
    draft.FormatName = copyName(draft.FormatName);
    return draft;
};

export const describeInventoryItem = (item: BuilderInventoryItem): string =>
    [
        item.isDefault ? 'Default document' : 'Saved document',
        item.templateName ?? 'No print template linked',
        `${String(item.assetCount)} asset${item.assetCount === 1 ? '' : 's'}`,
        item.isValid ? 'Valid' : 'Needs attention',
    ].join(' • ');
