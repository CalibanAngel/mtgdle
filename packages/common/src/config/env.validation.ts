import Joi from 'joi';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

type EnvironmentVariables = {
  NODE_ENV: Environment;

  BACK_API_HOST: string;
  BACK_API_PORT: number;

  FRONT_API_HOST: string
  FRONT_API_PORT: number

  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_SYNCHRONIZE: boolean;
  SCRYFALL_API_HOST: string;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
};

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.DEVELOPMENT),
  BACK_API_HOST: Joi.string().required(),
  BACK_API_PORT: Joi.number().default(3000),

  FRONT_API_HOST: Joi.string().required(),
  FRONT_API_PORT: Joi.number().default(5173),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_SYNCHRONIZE: Joi.boolean().default(false),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  SCRYFALL_API_HOST: Joi.string().uri().required(),
});
