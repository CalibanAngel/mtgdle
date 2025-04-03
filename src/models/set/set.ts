import { ApiProperty } from '@nestjs/swagger';

export enum SetType {
  // A yearly Magic core set (Tenth Edition, etc)
  core,
  // A rotational expansion set in a block (Zendikar, etc)
  expansion,
  //A reprint set that contains no new cards (Modern Masters, etc)
  masters,
  // An Arena set designed for Alchemy
  alchemy,
  //Masterpiece Series premium foil cards
  masterpiece,
  // A Commander-oriented gift set
  arsenal,
  // From the Vault gift sets
  from_the_vault,
  //Spellbook series gift sets
  spellbook,
  //Premium Deck Series decks
  premium_deck,
  //Duel Decks
  duel_deck,
  //Special draft sets, like Conspiracy and Battlebond
  draft_innovation,
  //Magic Online treasure chest prize sets
  treasure_chest,
  //Commander preconstructed decks
  commander,
  //Planechase sets
  planechase,
  //Archenemy sets
  archenemy,
  //Vanguard card sets
  vanguard,
  //A funny un-set or set with funny promos (Unglued, Happy Holidays, etc)
  funny,
  //A starter/introductory set (Portal, etc)
  starter,
  //A gift box set
  box,
  //A set that contains purely promotional cards
  promo,
  //A set made up of tokens and emblems.
  token,
  //A set made up of gold-bordered, oversize, or trophy cards that are not legal
  memorabilia,
  //A set that contains minigame card inserts from booster packs
  minigame,
}

export class Set {
  @ApiProperty({
    description: 'The name of the set.',
    type: 'string',
    example: 'Vintage Masters',
  })
  name: string;

  @ApiProperty({
    description: 'This card’s Set object UUID.',
    type: 'string',
    example: 'a944551a-73fa-41cd-9159-e8d0e4674403',
  })
  id: string;

  @ApiProperty({
    description: 'This card’s set code.',
    type: 'string',
    example: 'vma',
  })
  code: string;

  @ApiProperty({
    description:
      'The date the set was released or the first card was printed in the set (in GMT-8 Pacific time).',
    type: 'string',
  })
  releasedAt: string;

  @ApiProperty({
    description: 'The number of cards in this set.',
    type: 'number',
  })
  cardCount: number;

  @ApiProperty({
    description: 'The number of cards in this set.',
    enum: SetType,
    enumName: 'SetType',
  })
  set_type: SetType;

  @ApiProperty({
    description: 'A link to this set’s permapage on Scryfall’s website.',
    type: 'string',
  })
  scryfallUri: string;
}
