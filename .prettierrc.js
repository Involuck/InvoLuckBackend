export default {
  // Basic formatting configuration
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  quoteProps: 'as-needed',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Specific configuration for different file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: ['package.json', 'package-lock.json'],
      options: {
        tabWidth: 2,
        printWidth: 80
      }
    }
  ],

  // Specific configuration for different parsers
  endOfLine: 'lf',
  insertPragma: false,
  requirePragma: false,

  // Specific configuration for backend/Node.js
  embeddedLanguageFormatting: 'auto'
};
