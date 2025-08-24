/**
 * Jest configuration for InvoLuck Backend
 * TypeScript testing setup with MongoDB in-memory integration tests
 */

import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: '.',

  // Test directories
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/tests/**/*.test.ts',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/tests/**/*',
    '!src/emails/compiled/**/*',
    '!src/emails/maizzle/**/*',
    '!src/seeders/**/*',
    '!src/types/**/*',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test timeout
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: true,
  forceExit: true,

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

export default config;
