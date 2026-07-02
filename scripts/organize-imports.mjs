/** @format */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import prettier from 'prettier';
import ts from 'typescript';

import { normalizeImportDeclarations } from './import-order-support.mjs';

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
let prettierConfigPromise;

const getPrettierConfig = async () => {
    if (!prettierConfigPromise) {
        prettierConfigPromise = prettier.resolveConfig(process.cwd());
    }

    return prettierConfigPromise;
};

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

    const rgFiles = execFileSync(
        'rg',
        [
            '--files',
            '--glob',
            '*.ts',
            '--glob',
            '*.tsx',
            '--glob',
            '*.js',
            '--glob',
            '*.jsx',
            '--glob',
            '*.mjs',
            '--glob',
            '*.cjs',
            '--glob',
            '!coverage/**',
            '--glob',
            '!dist/**',
            '--glob',
            '!dist-electron/**',
            '--glob',
            '!node_modules/**',
            '--glob',
            '!release/**',
            '--glob',
            '!test-results/**',
        ],
        {
            cwd: process.cwd(),
            encoding: 'utf8',
        },
    )
        .split(/\r?\n/u)
        .filter(Boolean);

    return rgFiles
        .map((candidate) => path.resolve(process.cwd(), candidate))
        .filter((candidate) => {
            const segments = candidate.split(path.sep);
            return !segments.some((segment) => ignoredDirectoryNames.has(segment));
        });
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
    currentText = normalizeImportDeclarations(currentText);

    if (currentText !== sourceText) {
        const prettierConfig = await getPrettierConfig();
        currentText = await prettier.format(currentText, {
            ...prettierConfig,
            filepath: normalizedFilePath,
        });
    }

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
