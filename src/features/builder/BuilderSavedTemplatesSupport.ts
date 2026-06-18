/** @format */

import { builtInDefaultPrintTemplateHtml } from '../../db/startup/BuiltInDefaultPrintTemplate';
import type { SavedPrintTemplate } from './BuilderPageSupport';

export const defaultSavedPrintTemplates = (): readonly SavedPrintTemplate[] => [
    {
        name: 'Built-in default',
        templateHtml: builtInDefaultPrintTemplateHtml,
        updatedAt: new Date(0).toISOString(),
    },
];

const toSavedPrintTemplate = (input: unknown): SavedPrintTemplate | undefined => {
    if (!input || typeof input !== 'object') return undefined;
    const raw = input as Record<string, unknown>;
    if (typeof raw.name !== 'string' || typeof raw.templateHtml !== 'string') return undefined;
    return {
        name: raw.name.trim() || 'Shared template',
        templateHtml: raw.templateHtml,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    };
};

export const normalizeSavedPrintTemplates = (input: unknown): readonly SavedPrintTemplate[] => {
    if (!Array.isArray(input)) return defaultSavedPrintTemplates();
    const templates = input
        .map(toSavedPrintTemplate)
        .filter((entry): entry is SavedPrintTemplate => Boolean(entry));
    if (templates.length === 0) return defaultSavedPrintTemplates();
    const builtIn = defaultSavedPrintTemplates()[0];
    if (!builtIn) return templates;
    return templates.some((template) => template.name === builtIn.name)
        ? templates
        : [builtIn, ...templates];
};

export const upsertSavedPrintTemplate = (
    templates: readonly SavedPrintTemplate[],
    name: string,
    templateHtml: string,
): readonly SavedPrintTemplate[] => {
    const trimmedName = name.trim() || 'Shared template';
    const next = templates.filter((template) => template.name !== trimmedName);
    return [
        ...next,
        {
            name: trimmedName,
            templateHtml,
            updatedAt: new Date().toISOString(),
        },
    ];
};

export const removeSavedPrintTemplate = (
    templates: readonly SavedPrintTemplate[],
    name: string,
): readonly SavedPrintTemplate[] => templates.filter((template) => template.name !== name);

export const findSavedPrintTemplate = (
    templates: readonly SavedPrintTemplate[],
    name: string,
): SavedPrintTemplate | undefined => templates.find((template) => template.name === name);

export const templateNameFromFile = (fileName: string): string => {
    const stem = fileName.replace(/\.[^.]+$/u, '').trim();
    return stem || 'Shared template';
};
