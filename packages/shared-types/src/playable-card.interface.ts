import { ICardImageUris } from './card-image-uris.interface';

export interface IInsertManualCardsDto {
  cardsName: string[];
}

export interface IPlayableCard {
  cardId: string;

  name: string;

  imageUris: ICardImageUris;
}
