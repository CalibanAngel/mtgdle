import Joi from 'joi';
import { DevMode } from './mode.enum';

const EnvSchema = Joi.object({
  API_HOST: Joi.string().required(),
  API_PORT: Joi.number().required(),
  API_URL: Joi.string().uri().required(),
  MODE: Joi.string().valid(DevMode.DEVELOPMENT, DevMode.PRODUCTION, DevMode.TEST).required(),
}).unknown(true);

const raw = {
  API_HOST: import.meta.env.BACK_API_HOST,
  API_PORT: import.meta.env.BACK_API_PORT,
  API_URL: `http://${import.meta.env.BACK_API_HOST}:${import.meta.env.BACK_API_PORT}`,
  MODE: import.meta.env.MODE,
};

const { value, error } = EnvSchema.validate(raw, {
  abortEarly: false,
  convert: true,
  stripUnknown: false,
});

if (error) {
  console.error('Invalid client environment:', error.details.map(d => d.message).join('; '));
  throw new Error('Client environment validation failed');
}

// Add your types here
export type Env = {
  API_URL: string;
  API_PORT: number;
  MODE: DevMode;
};

export const env = value as Env;
