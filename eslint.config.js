/** @format */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

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
            vaultbill: {
                rules: {
                    'kebab-class-names': kebabCaseClassNameRule,
                },
            },
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
            'vaultbill/kebab-class-names': 'error',
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
