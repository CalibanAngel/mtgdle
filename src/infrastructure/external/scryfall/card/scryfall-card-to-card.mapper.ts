import { ScryfallCard } from '@scryfall/api-types';
import { Card } from '../../../../models/card/card';
import {
  BorderColor,
  Color,
  GameName,
  Layout,
  Rarity,
} from '../../../../models/card/card.enum';
import { Legalities } from '../../../../models/card/card.interface';
import { CardFace } from '../../../../models/card/card-face/card-face';
import * as _ from 'lodash';
import { ScryfallCardFields } from '@scryfall/api-types/src/objects/Card/CardFields';
import { ScryfallCardFace } from '@scryfall/api-types/src/objects/Card/CardFace';
import { CardImageUris } from '../../../../models/card/card-image-uris/card-image-uris';

function scryfallDoubleSidedOrReversibleCardFaceToCardFace(
  scryfallCardFace: ScryfallCardFace.DoubleSided | ScryfallCardFace.Reversible,
): CardImageUris {
  return {
    borderCrop: scryfallCardFace.image_uris.border_crop,
    large: scryfallCardFace.image_uris.large,
    normal: scryfallCardFace.image_uris.normal,
    png: scryfallCardFace.image_uris.png,
    small: scryfallCardFace.image_uris.small,
  };
}

function scryfallCardFaceToCardFace({
  card_faces,
}: ScryfallCardFields.Gameplay.CardFaces<ScryfallCardFace.Any>): CardFace[] {
  return card_faces.map((card_face) => {
    const cardFace = new CardFace();

    if (_.has(card_face, 'image_uris')) {
      cardFace.imageUris = scryfallDoubleSidedOrReversibleCardFaceToCardFace(
        card_face as ScryfallCardFace.DoubleSided,
      );
    }

    cardFace.manaCost = card_face.mana_cost;
    cardFace.power = card_face.power;
    cardFace.toughness = card_face.toughness;
    cardFace.loyalty = card_face.loyalty;
    cardFace.typeLine = card_face.type_line;
    cardFace.description = card_face.oracle_text;
    cardFace.flavorText = card_face.flavor_text;
    cardFace.name = card_face.name;

    return cardFace;
  });
}

function scryfallRootCardToCard(
  scryfallCard: ScryfallCard.AnySingleFaced | ScryfallCard.AnySingleSidedSplit,
): Card {
  const card = new Card();

  card.name = scryfallCard.name;
  card.scryfallUri = scryfallCard.scryfall_uri;
  card.id = scryfallCard.id;
  card.keywords = scryfallCard.keywords;
  card.rarity = scryfallCard.rarity as Rarity;
  card.legalities = scryfallCard.legalities as Legalities;
  card.releasedDate = scryfallCard.released_at;
  card.setId = scryfallCard.set_id;
  card.reprint = scryfallCard.reprint;
  card.borderColor = scryfallCard.border_color as BorderColor;
  card.games = scryfallCard.games as GameName[];
  card.convertedManaCost = scryfallCard.cmc;
  card.colorIdentity = scryfallCard.color_identity as Color[];
  card.colors = (scryfallCard.colors as Color[]) ?? [];
  card.layout = scryfallCard.layout as Layout;

  return card;
}

function scryfallAnySingleSidedSplitCardToCard(
  scryfallCard: ScryfallCard.AnySingleSidedSplit,
): Card {
  const card = {
    ...scryfallRootCardToCard(scryfallCard),
    cardFaces: {
      ...scryfallCardFaceToCardFace(scryfallCard),
    },
  };

  card.cardFaces.map((cardFace) => {
    cardFace.imageUris = {
      borderCrop: scryfallCard.image_uris.border_crop,
      large: scryfallCard.image_uris.large,
      normal: scryfallCard.image_uris.normal,
      png: scryfallCard.image_uris.png,
      small: scryfallCard.image_uris.small,
    };
  });
  return card;
}

// TODO : later when everything works with 1 side
// function scryfallAnyDoubleSidedSplitToCard(
//   scryfallCard: ScryfallCard.AnyDoubleSidedSplit,
// ): Card {
//   const card = {
//     ...scryfallRootCardToCard(scryfallCard),
//     cardFaces: {
//       ...scryfallCardFaceToCardFace(scryfallCard),
//     },
//   };
//
//   return card;
// }

function scryfallAnySingleFacedCardToCardMapper(
  scryfallCard: ScryfallCard.AnySingleFaced,
): Card {
  const card = scryfallRootCardToCard(scryfallCard);
  const cardFace = new CardFace();

  cardFace.imageUris = {
    borderCrop: scryfallCard.image_uris.border_crop,
    large: scryfallCard.image_uris.large,
    normal: scryfallCard.image_uris.normal,
    png: scryfallCard.image_uris.png,
    small: scryfallCard.image_uris.small,
  };
  cardFace.manaCost = scryfallCard.mana_cost;
  cardFace.power = scryfallCard.power;
  cardFace.toughness = scryfallCard.toughness;
  cardFace.loyalty = scryfallCard.loyalty;
  cardFace.typeLine = scryfallCard.type_line;
  cardFace.description = scryfallCard.oracle_text;
  cardFace.flavorText = scryfallCard.flavor_text;

  card.cardFaces = [cardFace];

  return card;
}

export function scryfallAnyCardToCard(scryfallCard: ScryfallCard.Any): Card {
  let card = new Card();

  if (card.cardFaces?.length) {
    if (_.has(card, 'imageUris')) {
      card = scryfallAnySingleSidedSplitCardToCard(
        scryfallCard as ScryfallCard.AnySingleSidedSplit,
      );
    }
  } else {
    card = scryfallAnySingleFacedCardToCardMapper(
      scryfallCard as ScryfallCard.AnySingleFaced,
    );
  }

  return card;
}
