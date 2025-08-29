import { SetType } from './set.enum';

export interface ICardSet {
  name: string;

  id: string;

  code: string;

  releasedAt?: string;

  cardCount: number;

  setType: SetType;

  scryfallUri: string;

  iconSVGuri: string;

  // cards: Card[];

  createdAt: string;

  updatedAt: string;
}
