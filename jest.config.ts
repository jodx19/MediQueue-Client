import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterSetup: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/app/core/**/*.ts',
    'src/app/shared/**/*.ts',
    '!src/app/core/api/**',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
};

export default config;
