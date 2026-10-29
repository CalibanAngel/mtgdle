import type { Config } from 'jest';
import unitConfig from './jest.config';

const config: Config = {
  ...unitConfig,
  testMatch: ['<rootDir>/test/src/**/*.ti.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: './coverage/integration',
};

export default config;
