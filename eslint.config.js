import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import zodRules from './eslint-rules/zod-rules.js';
import sortDeclarations from './eslint-rules/sort-declarations.js';
// ...existing code...
import prettierConfig from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.ts'],
        ignores: ['**/*.test.ts', '**/*.spec.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: process.cwd(),
            },
        },
        plugins: {
            zod: zodRules,
            sort: sortDeclarations,
            // ...existing code...
            'import-x': importX,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: false,
                    fixStyle: 'inline-type-imports',
                },
            ],
            'zod/zod-require-strict': 'error',
            'zod/zod-require-explicit-type': 'error',
            'sort/sort-declarations': 'warn',
            // ...existing code...

            // Import sorrendezés és csoportosítás
            'import-x/order': [
                'warn',
                {
                    groups: [
                        'builtin', // Node.js beépített modulok
                        'external', // npm csomagok
                        'internal', // saját modulok absolute path-tal
                        'parent', // ../
                        'sibling', // ./
                        'index', // ./index
                        'type', // type importok
                    ],
                    'newlines-between': 'never',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],

            // Üres sorok szabályok
            'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0, maxBOF: 0 }],
            'padding-line-between-statements': [
                'warn',
                // 1. Import blokk után üres sor
                { blankLine: 'always', prev: 'import', next: '*' },
                { blankLine: 'any', prev: 'import', next: 'import' },

                // 3. Const/let deklarációk után üres sor (ha nem ugyanolyan következik)
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },

                // 4. Function deklarációk előtt és után üres sor
                { blankLine: 'always', prev: '*', next: 'function' },
                { blankLine: 'always', prev: 'function', next: '*' },

                // 5. Export blokk előtt üres sor
                { blankLine: 'always', prev: '*', next: 'export' },
                { blankLine: 'any', prev: 'export', next: 'export' },

                // Return előtt üres sor
                { blankLine: 'always', prev: '*', next: 'return' },
            ],
        },
    },
    {
        // Test fájlok külön konfiguráció (type-aware linting nélkül)
        files: ['**/*.test.ts', '**/*.spec.ts'],
        languageOptions: {
            parser: tseslint.parser,
        },
        plugins: {
            // ...existing code...
            'import-x': importX,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            // ...existing code...
            'import-x/order': [
                'warn',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                        'type',
                    ],
                    'newlines-between': 'never',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
        },
    },
    {
        ignores: ['node_modules/**', 'dist/**', 'drizzle/**'],
    },
];
