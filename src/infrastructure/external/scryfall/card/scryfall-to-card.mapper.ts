/*
import { Card, Rarity } from '../../../../models/card/card';
import { ScryfallCard } from '@scryfall/api-types';
import { Set } from '../../../../models/set/set';

// https://scryfall.com/docs/api/cards
export function scryfallCardToCardMapper(scryfallCard: ScryfallCard.Any): Card {
  const card = new Card();

  // Basic mapping
  card.id = scryfallCard.id;
  card.name = scryfallCard.name;
  card.releasedDate = scryfallCard.released_at;
  card.scryfallUri = scryfallCard.scryfall_uri;
  // Map rarity. You might need to convert or adjust if enum values differ.
  card.rarity = scryfallCard.rarity as Rarity;
  // Scryfall may not always provide flavor text.
  card.flavorText = (scryfallCard as any).flavor_text || '';
  card.typeLine = scryfallCard.type_line;
  card.manaCost = scryfallCard.mana_cost || '';
  card.convertedManaCost = scryfallCard.cmc;
  card.colors = scryfallCard.colors;
  card.colorIdentity = scryfallCard.color_identity;
  card.keywords = scryfallCard.keywords;

  // Set mapping (if your domain model includes set info)
  const cardSet = new Set();
  cardSet.id = scryfallCard.set_id;
  cardSet.name = scryfallCard.set_name;
  cardSet.setType = scryfallCard.set_type;
  card.set = cardSet;

  // Additional mapping for other fields can be added here as needed.
  return card;
}
*/
