/** @format */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import ts from 'typescript';

import { compareImportSources, getImportGroupRank } from './import-order-support.mjs';

const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ignoredDirectoryNames = new Set([
    '.git',
    'coverage',
    'dist',
    'dist-electron',
    'node_modules',
    'release',
    'test-results',
]);

const compilerOptions = {
    allowJs: true,
    checkJs: false,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
};

const formatOptions = ts.getDefaultFormatCodeSettings();
const preferences = {
    providePrefixAndSuffixTextForRename: false,
};

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const stagedOnly = args.includes('--staged');
const candidateArgs = args.filter((arg) => !arg.startsWith('--'));

const resolveCandidateFiles = async () => {
    if (candidateArgs.length > 0) {
        return candidateArgs
            .map((candidate) => path.resolve(process.cwd(), candidate))
            .filter((candidate) => supportedExtensions.has(path.extname(candidate).toLowerCase()));
    }

    if (stagedOnly) {
        const stagedFiles = execFileSync(
            'git',
            ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
            {
                cwd: process.cwd(),
                encoding: 'utf8',
            },
        )
            .split(/\r?\n/u)
            .filter(Boolean)
            .map((candidate) => path.resolve(process.cwd(), candidate));

        return stagedFiles.filter((candidate) =>
            supportedExtensions.has(path.extname(candidate).toLowerCase()),
        );
    }

    return walkDirectory(process.cwd());
};

const walkDirectory = async (directoryPath) => {
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });
    const filePaths = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(directoryPath, entry.name);

            if (entry.isDirectory()) {
                if (ignoredDirectoryNames.has(entry.name)) {
                    return [];
                }

                return walkDirectory(entryPath);
            }

            return supportedExtensions.has(path.extname(entry.name).toLowerCase())
                ? [entryPath]
                : [];
        }),
    );

    return filePaths.flat();
};

const applyTextChanges = (sourceText, textChanges) => {
    const orderedChanges = [...textChanges].sort(
        (left, right) => right.span.start - left.span.start,
    );

    let updatedText = sourceText;
    for (const change of orderedChanges) {
        updatedText =
            updatedText.slice(0, change.span.start) +
            change.newText +
            updatedText.slice(change.span.start + change.span.length);
    }

    return updatedText;
};

const importDeclarationPattern = /^(?:import|export)\s/u;

const normalizeImportChunks = (sourceText) => {
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

const organizeFileImports = async (filePath) => {
    const sourceText = await fs.readFile(filePath, 'utf8');
    const normalizedFilePath = path.resolve(filePath);
    let currentText = sourceText;

    const languageServiceHost = {
        fileExists: (candidate) => candidate === normalizedFilePath || ts.sys.fileExists(candidate),
        getCompilationSettings: () => compilerOptions,
        getCurrentDirectory: () => process.cwd(),
        getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
        getDirectories: ts.sys.getDirectories,
        getScriptFileNames: () => [normalizedFilePath],
        getScriptSnapshot: (candidate) => {
            if (candidate === normalizedFilePath) {
                return ts.ScriptSnapshot.fromString(currentText);
            }

            const candidateText = ts.sys.readFile(candidate);
            return candidateText === undefined
                ? undefined
                : ts.ScriptSnapshot.fromString(candidateText);
        },
        getScriptVersion: () => '1',
        readDirectory: ts.sys.readDirectory,
        readFile: ts.sys.readFile,
    };

    const service = ts.createLanguageService(languageServiceHost);
    const changes = service.organizeImports(
        {
            fileName: normalizedFilePath,
            type: 'file',
        },
        formatOptions,
        preferences,
    );

    for (const change of changes) {
        currentText = applyTextChanges(currentText, change.textChanges);
    }

    service.dispose();
    currentText = normalizeImportChunks(currentText);

    const prettierConfig = await prettier.resolveConfig(normalizedFilePath);
    currentText = await prettier.format(currentText, {
        ...prettierConfig,
        filepath: normalizedFilePath,
    });

    if (currentText === sourceText) {
        return false;
    }

    if (!checkOnly) {
        await fs.writeFile(normalizedFilePath, currentText, 'utf8');
    }

    return true;
};

const uniqueFiles = [...new Set(await resolveCandidateFiles())];
const existingFiles = [];

for (const candidate of uniqueFiles) {
    try {
        const stat = await fs.stat(candidate);
        if (stat.isFile()) {
            existingFiles.push(candidate);
        }
    } catch {
        // Skip deleted or missing files from a staged diff.
    }
}

const changedFiles = [];
for (const filePath of existingFiles) {
    if (await organizeFileImports(filePath)) {
        changedFiles.push(filePath);
    }
}

if (!checkOnly && stagedOnly && changedFiles.length > 0) {
    execFileSync('git', ['add', '--', ...changedFiles], {
        cwd: process.cwd(),
        stdio: 'inherit',
    });
}

if (checkOnly && changedFiles.length > 0) {
    console.error('Imports are not organized in:');
    for (const filePath of changedFiles) {
        console.error(`- ${path.relative(process.cwd(), filePath)}`);
    }
    process.exitCode = 1;
} else if (!checkOnly && changedFiles.length > 0) {
    console.log(`Organized imports in ${changedFiles.length} file(s).`);
} else {
    console.log(checkOnly ? 'Imports are already organized.' : 'No import changes were needed.');
}
