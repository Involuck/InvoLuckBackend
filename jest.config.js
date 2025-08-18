export default {
  testEnvironment: 'node',

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/node_modules/**',
    '!src/**/coverage/**',
    '!src/**/jest.config.js'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};