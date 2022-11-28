module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    'object-shorthand': ['error'],
    'object-curly-spacing': ['error', 'always'],
    'arrow-parens': ['error', 'always'],
    'brace-style': ['off', 'off'],
    'id-blacklist': 'off',
    'id-match': 'off',
    'linebreak-style': 'off',
    'new-parens': 'off',
    'newline-per-chained-call': 'off',
    'no-extra-semi': 'off',
    'no-irregular-whitespace': 'off',
    'no-trailing-spaces': [
      'error',
      { ignoreComments: true, skipBlankLines: true },
    ],
    'no-underscore-dangle': 'off',
    'space-in-parens': ['off', 'never'],
    quotes: [
      'error',
      'single',
      { allowTemplateLiterals: true, avoidEscape: true },
    ],
    'no-console': ['error'],
    curly: ['error', 'multi-line'],
    'no-useless-constructor': ['off'],
    'comma-dangle': [
      'error',
      {
        objects: 'always-multiline',
        arrays: 'always-multiline',
        functions: 'never',
        imports: 'always-multiline',
        exports: 'always-multiline',
      },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'prefer-arrow-callback': ['error'],
    'no-shadow': ['off'],
    'prefer-const': ['error', { destructuring: 'all' }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    '@typescript-eslint/explicit-member-accessibility': [
      'off',
      { accessibility: 'explicit' },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/no-useless-constructor': ['off'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/prefer-optional-chain': ['warn'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { ignoreRestSiblings: true },
    ],
    '@typescript-eslint/ban-types': [
      'error',
      { types: { object: false }, extendDefaults: true },
    ],

    '@typescript-eslint/naming-convention': [
      'off',
      {
        selector: 'default',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'variable',
        modifiers: ['const'],
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'memberLike',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'require',
      },
      {
        selector: 'memberLike',
        modifiers: ['protected'],
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'memberLike',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'property',
        modifiers: ['static'],
        format: null,
      },
      {
        selector: 'parameterProperty',
        modifiers: ['private'],
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'enumMember',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'objectLiteralProperty',
        format: null,
      },
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'signature',

          // Constructors
          'private-constructor',
          'protected-constructor',
          'public-constructor',
          'constructor',

          // Fields
          'private-decorated-field',
          'private-abstract-field',
          'private-instance-field',
          'private-field',

          'protected-decorated-field',
          'protected-abstract-field',
          'protected-instance-field',
          'protected-field',

          'public-decorated-field',
          'public-abstract-field',
          'public-instance-field',
          'public-field',

          'decorated-field',
          'field',

          // Methods
          'private-decorated-method',
          'private-instance-method',
          'private-abstract-method',
          'private-method',

          'protected-decorated-method',
          'protected-instance-method',
          'protected-abstract-method',
          'protected-method',

          'public-decorated-method',
          'public-instance-method',
          'public-abstract-method',
          'public-method',

          'decorated-method',
          'instance-method',
          'abstract-method',
          'method',

          'private-static-field',
          'protected-static-field',
          'public-static-field',
          'static-field',

          'private-static-method',
          'protected-static-method',
          'public-static-method',
          'static-method',

          'instance-field',
          'abstract-field',
        ],
      },
    ],
    '@typescript-eslint/typedef': [
      'error',
      {
        arrowParameter: false,
        memberVariableDeclaration: false,
        parameter: false,
        propertyDeclaration: true,
      },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
    'import/newline-after-import': ['error'],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};