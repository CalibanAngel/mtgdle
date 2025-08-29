import { ScryfallSet } from '@scryfall/api-types';
import { CardSet } from '../../../../models/set/set';
import { SetType } from '@mtgdle/shared-types';

export function scryfallSetToSetMapper(scryfallSet: ScryfallSet): CardSet {
  const set = new CardSet();

  set.id = scryfallSet.id;
  set.name = scryfallSet.name;
  set.code = scryfallSet.code;
  set.releasedAt = scryfallSet.released_at;
  set.cardCount = scryfallSet.card_count;
  set.setType = scryfallSet.set_type as SetType;
  set.scryfallUri = scryfallSet.scryfall_uri;
  set.iconSVGuri = scryfallSet.icon_svg_uri;

  return set;
}
