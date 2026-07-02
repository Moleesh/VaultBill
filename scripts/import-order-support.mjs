/** @format */

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
