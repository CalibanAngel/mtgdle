import { ScryfallSet } from '@scryfall/api-types';
import { Set } from '../../../../models/set/set';
import { SetType } from '../../../../models/set/set.enum';

export function scryfallSetToSetMapper(scryfallSet: ScryfallSet): Set {
  const set = new Set();

  set.id = scryfallSet.id;
  set.name = scryfallSet.name;
  set.code = scryfallSet.code;
  set.releasedAt = scryfallSet.released_at;
  set.cardCount = scryfallSet.card_count;
  set.setType = scryfallSet.set_type as SetType;
  set.scryfallUri = scryfallSet.scryfall_uri;

  return set;
}
