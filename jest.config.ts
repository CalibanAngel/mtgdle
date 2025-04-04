import type { Config } from 'jest';

const config: Config = {
  // Define file extensions Jest will process.
  moduleFileExtensions: ['js', 'json', 'ts'],

  // The root directory of your project
  rootDir: '.',

  // Patterns Jest uses to detect test files.
  // testRegex: '.*\\.spec\\.ts$',

  moduleDirectories: ['node_modules', 'src'],

  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Paths to exclude from coverage collection.
  coveragePathIgnorePatterns: ['/node_modules/'],

  testMatch: ['<rootDir>/test/src/**/*.spec.ts'],

  // Directory where Jest should output its coverage files.
  coverageDirectory: './coverage',

  // The test environment that will be used for testing.
  testEnvironment: 'node',
};

export default config;
