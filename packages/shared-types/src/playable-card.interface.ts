import { ICardImageUris } from './card-image-uris.interface';

export interface IPlayableCard {
  cardId: string;

  name: string;

  imageUris: ICardImageUris;
}
