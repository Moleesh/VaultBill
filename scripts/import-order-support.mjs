/** @format */

import ts from 'typescript';

const styleImportPattern = /\.(?:css|scss|sass|less)$/iu;

export const isStyleImport = (source) => styleImportPattern.test(source);

export const isReactFamilyImport = (source) =>
    source === 'react' ||
    source === 'react-dom' ||
    source === 'react-router-dom' ||
    source.startsWith('react/') ||
    source.startsWith('react-dom/') ||
    source.startsWith('react-router-dom/');

export const isInternalImport = (source) => source.startsWith('./') || source.startsWith('../');

export const isHookImport = (source) => {
    if (!isInternalImport(source)) {
        return false;
    }

    const normalizedSource = source.replace(/\\/gu, '/');
    const segments = normalizedSource.split('/');
    const baseName = segments.at(-1) ?? '';

    return (
        segments.includes('hooks') ||
        baseName.startsWith('use') ||
        baseName === 'use' ||
        /^use[A-Z]/u.test(baseName)
    );
};

export const getImportGroupRank = (source) => {
    if (isStyleImport(source)) {
        return 4;
    }

    if (isReactFamilyImport(source)) {
        return 0;
    }

    if (!isInternalImport(source)) {
        return 1;
    }

    if (isHookImport(source)) {
        return 3;
    }

    return 2;
};

export const compareImportSources = (leftSource, rightSource) => {
    const leftGroup = getImportGroupRank(leftSource);
    const rightGroup = getImportGroupRank(rightSource);

    if (leftGroup !== rightGroup) {
        return leftGroup - rightGroup;
    }

    return leftSource.localeCompare(rightSource, undefined, {
        sensitivity: 'base',
    });
};

export const findImportOrderIssue = (entries) => {
    for (let index = 1; index < entries.length; index += 1) {
        const previous = entries[index - 1];
        const current = entries[index];

        if (compareImportSources(previous.source, current.source) > 0) {
            return {
                current,
                previous,
            };
        }
    }

    return null;
};

const importDeclarationPattern = /^(?:import|export)\s/u;

export const normalizeImportDeclarations = (sourceText) => {
    const sourceFile = ts.createSourceFile(
        'imports.ts',
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
    );
    const importStatements = sourceFile.statements.filter((statement) =>
        ts.isImportDeclaration(statement),
    );

    if (importStatements.length === 0) {
        return sourceText;
    }

    const firstImportStart = importStatements[0].getStart(sourceFile);
    const trailingText = sourceText.slice(importStatements.at(-1).end);
    const prefix = sourceText.slice(0, firstImportStart);
    const chunks = importStatements.map((statement, index) => {
        const chunkStart = index === 0 ? statement.getStart(sourceFile) : statement.getFullStart();
        const nextStart =
            index === importStatements.length - 1
                ? statement.end
                : importStatements[index + 1].getFullStart();
        const chunkText = sourceText.slice(chunkStart, nextStart).trim();

        return {
            group: getImportGroupRank(statement.moduleSpecifier.text),
            source: statement.moduleSpecifier.text,
            text: chunkText,
        };
    });

    const sortedChunks = [...chunks].sort((left, right) =>
        compareImportSources(left.source, right.source),
    );

    const groupedChunks = [];
    let currentGroup = -1;
    for (const chunk of sortedChunks) {
        if (chunk.group !== currentGroup) {
            groupedChunks.push([]);
            currentGroup = chunk.group;
        }

        groupedChunks.at(-1).push(chunk.text);
    }

    const importBlock = groupedChunks
        .map((group) => group.filter((chunk) => importDeclarationPattern.test(chunk)).join('\n'))
        .filter(Boolean)
        .join('\n\n');

    return `${prefix}${importBlock}${trailingText}`;
};
