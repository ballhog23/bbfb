import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import security from 'eslint-plugin-security';

export default [
    // Server-side: Node.js environment
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            globals: globals.node,
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            security,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...security.configs.recommended.rules,
        },
    },

    // Client-side: browser environment
    {
        files: ['public-ts/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            globals: globals.browser,
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            security,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...security.configs.recommended.rules,
        },
    },

    prettier,
];
