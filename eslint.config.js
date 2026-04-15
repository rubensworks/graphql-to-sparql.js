const config = require('@rubensworks/eslint-config');

module.exports = config([
  {
    files: [ '**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './tsconfig.json' ],
      },
    },
    rules: {
      'ts/naming-convention': [
        'error',
        {
          selector: 'default',
          format: [ 'camelCase' ],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'import',
          format: null,
        },
        {
          selector: 'variable',
          format: [ 'camelCase', 'UPPER_CASE' ],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'typeLike',
          format: [ 'PascalCase' ],
        },
        {
          selector: [ 'typeParameter' ],
          format: [ 'PascalCase' ],
          prefix: [ 'T' ],
        },
        {
          selector: 'interface',
          format: [ 'PascalCase' ],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'enumMember',
          format: [ 'camelCase', 'UPPER_CASE' ],
        },
        {
          selector: 'parameter',
          format: [ 'camelCase' ],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
      ],
    },
  },
  {
    files: [ '**/test/**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './test/tsconfig.json' ],
      },
    },
    rules: {
      'import/no-nodejs-modules': 'off',
      'ts/no-require-imports': 'off',
      'ts/no-var-requires': 'off',
      'ts/naming-convention': 'off',
      'jest/no-test-return-statement': 'off',
    },
  },
  {
    files: [ '**/bin/**/*.ts' ],
    rules: {
      'import/no-nodejs-modules': 'off',
      'ts/no-require-imports': 'off',
      'no-sync': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-floating-promises': 'off',
      'ts/prefer-nullish-coalescing': 'off',
      'line-comment-position': 'off',
    },
  },
  {
    files: [
      'eslint.config.js',
    ],
    rules: {
      'ts/no-var-requires': 'off',
      'ts/no-require-imports': 'off',
    },
  },
]);
