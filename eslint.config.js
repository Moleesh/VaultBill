/** @format */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typedTypeScriptConfigs = [
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
].map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
}));

export default tseslint.config(
    {
        ignores: [
            'dist',
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
        },
    },
    {
        files: ['**/*.d.ts'],
        rules: {
            '@typescript-eslint/consistent-type-definitions': 'off',
        },
    },
    prettier,
);
