import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      // RELAXED RULES:
      '@typescript-eslint/no-unused-vars': 'off', // allow unused vars
      '@typescript-eslint/explicit-function-return-type': 'off', // let TS infer
      '@typescript-eslint/no-explicit-any': 'warn', // allow any, just warn
      'no-unused-vars': 'off', // allow unused JS vars
      'no-undef': 'off', // allow browser globals
    },
  },
];
