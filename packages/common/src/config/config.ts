import { DatabaseConfig } from '@mtgdle/common/config/database.config';
import { ScryfallConfig } from '@mtgdle/common/config/scryfall.config';
import { HttpConfig } from '@mtgdle/common/config/http.config';

export type Configuration = {
  database: DatabaseConfig;
  scryfall: ScryfallConfig;
  http: HttpConfig;
};
