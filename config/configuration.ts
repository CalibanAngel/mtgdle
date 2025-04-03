import * as process from 'node:process';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export interface Configuration {
  node_env: Environment;
  http: {
    host: string;
    port: number;
  };
  database: {
    host: string;
    port: number;
    synchronize: boolean;
    username: string;
    password: string;
    databaseName: string;
  };
  scryfall: {
    host: string;
  };
}

export default (): Configuration => ({
  node_env: process.env.NODE_ENV as Environment,
  http: {
    host: process.env.APP_HOST,
    port: parseInt(process.env.APP_PORT, 10) || 3000,
  },
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    databaseName: process.env.DATABASE_NAME,
  },
  scryfall: {
    host: process.env.SCRYFALL_API_HOST,
  },
});
