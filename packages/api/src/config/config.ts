import { DatabaseConfig } from './database.config';
import { ScryfallConfig } from './scryfall.config';
import { HttpConfig } from './http.config';
import { AdminConfig } from './admin.config';

export type Configuration = {
  database: DatabaseConfig;
  scryfall: ScryfallConfig;
  http: HttpConfig;
  admin: AdminConfig;
};
