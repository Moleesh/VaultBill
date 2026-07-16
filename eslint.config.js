/** @format */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
    compareImportSources,
    findImportOrderIssue,
    getImportGroupRank,
    normalizeImportDeclarations,
} from './scripts/import-order-support.mjs';

const kebabCaseClassNameRule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'enforce kebab-case DOM class names',
        },
        schema: [],
    },
    create(context) {
        const kebabClassNamePattern = /^[a-z0-9-]+$/u;

        const reportInvalidClassName = (node, className) => {
            for (const classNameToken of className.split(/\s+/u).filter(Boolean)) {
                if (!kebabClassNamePattern.test(classNameToken)) {
                    context.report({
                        node,
                        message: `Class names must use kebab-case. "${classNameToken}" is not allowed.`,
                    });
                    return;
                }
            }
        };

        const readStaticString = (node) => {
            if (!node) {
                return null;
            }

            if (node.type === 'Literal' && typeof node.value === 'string') {
                return node.value;
            }

            if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
                return node.quasis[0]?.value.cooked ?? '';
            }

            return null;
        };

        const checkClassNameValue = (node) => {
            const value = readStaticString(node);

            if (value === null) {
                return;
            }

            reportInvalidClassName(node, value);
        };

        return {
            JSXAttribute(node) {
                if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') {
                    return;
                }

                if (!node.value) {
                    return;
                }

                if (node.value.type === 'Literal') {
                    checkClassNameValue(node.value);
                    return;
                }

                if (node.value.type === 'JSXExpressionContainer') {
                    checkClassNameValue(node.value.expression);
                }
            },
            Property(node) {
                const isClassNameProperty =
                    (node.key.type === 'Identifier' && node.key.name === 'className') ||
                    (node.key.type === 'Literal' && node.key.value === 'className');

                if (!isClassNameProperty) {
                    return;
                }

                checkClassNameValue(node.value);
            },
        };
    },
};

const importOrderRule = {
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'enforce VaultBill import ordering: React, libraries, internal modules, hooks, then styles',
        },
        fixable: 'code',
        schema: [],
    },
    create(context) {
        return {
            Program(node) {
                const sourceCode = context.sourceCode;
                const imports = node.body
                    .filter((statement) => statement.type === 'ImportDeclaration')
                    .map((statement) => ({
                        node: statement,
                        source: statement.source.value,
                    }))
                    .filter((entry) => typeof entry.source === 'string');

                const issue = findImportOrderIssue(imports);
                if (!issue) {
                    return;
                }

                const currentGroup = getImportGroupRank(issue.current.source);
                const previousGroup = getImportGroupRank(issue.previous.source);
                const sameGroup = currentGroup === previousGroup;

                context.report({
                    node: issue.current.node,
                    message: sameGroup
                        ? `Import "${issue.current.source}" must be sorted before "${issue.previous.source}" within its group.`
                        : `Import "${issue.current.source}" is in the wrong group order. Expected React imports first, then libraries, internal modules, hooks, and styles last.`,
                    fix: (fixer) => {
                        const firstImport = imports[0]?.node;
                        const lastImport = imports.at(-1)?.node;
                        if (!firstImport || !lastImport) {
                            return null;
                        }

                        const importBlock = sourceCode.text.slice(
                            firstImport.range[0],
                            lastImport.range[1],
                        );
                        const normalizedImportBlock = normalizeImportDeclarations(importBlock);
                        if (normalizedImportBlock === importBlock) {
                            return null;
                        }

                        return fixer.replaceTextRange(
                            [firstImport.range[0], lastImport.range[1]],
                            normalizedImportBlock,
                        );
                    },
                });

                for (let index = 1; index < imports.length; index += 1) {
                    const previous = imports[index - 1];
                    const current = imports[index];
                    if (compareImportSources(previous.source, current.source) > 0) {
                        break;
                    }
                }
            },
        };
    },
};

const typedTypeScriptConfigs = [
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
}));

const vaultbillPlugin = {
    rules: {
        'import-order': importOrderRule,
        'kebab-class-names': kebabCaseClassNameRule,
    },
};

export default tseslint.config(
    {
        ignores: [
            'android/.gradle',
            'android/app/build',
            'android/app/src/main/assets',
            'dist',
            'dist-android',
            'dist-electron',
            'release',
            'coverage',
            'test-results',
            'node_modules',
            'eslint.config.js',
        ],
    },
    js.configs.recommended,
    {
        files: ['**/*.{js,cjs,mjs}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            vaultbill: vaultbillPlugin,
        },
        rules: {
            'vaultbill/import-order': 'error',
        },
    },
    ...typedTypeScriptConfigs,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.electron.json'],
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            vaultbill: vaultbillPlugin,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'func-style': ['error', 'expression', { allowArrowFunctions: true }],
            'prefer-arrow-callback': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-template': 'error',
            'prefer-destructuring': ['error', { object: true, array: false }],
            'object-shorthand': ['error', 'always'],
            'no-param-reassign': 'error',
            'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
            'react/forbid-component-props': ['error', { forbid: ['style'] }],
            'react-refresh/only-export-components': 'off',
            '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            'vaultbill/import-order': 'error',
            'vaultbill/kebab-class-names': 'error',
        },
    },
    {
        files: ['**/*.d.ts'],
        rules: {
            '@typescript-eslint/consistent-type-definitions': 'off',
        },
    },
    {
        files: ['**/__tests__/**/*.{ts,tsx}'],
        rules: {
            'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
        },
    },
    {
        files: [
            'src/components/__tests__/AppShell.spec.tsx',
            'src/components/ReorderableRows/usePointerReorder.ts',
            'src/features/builder/BuilderFieldDrawer.tsx',
            'src/features/builder/useBuilderPageActions.ts',
            'src/features/reports/ReportsFilterPanel.tsx',
            'src/features/reports/useReportsPageFilters.ts',
            'src/features/settings/SettingsSecurityAccess.tsx',
            'src/features/settings/__tests__/SettingsPage.spec.tsx',
        ],
        rules: {
            'max-lines': 'off',
        },
    },
    prettier,
);
