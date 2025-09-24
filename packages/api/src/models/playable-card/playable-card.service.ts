import { PlayableCardRepository } from './playable-card.repository';
import { InsertedResult } from '../../infrastructure/database/database.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlayableCardService {
  constructor(
    private readonly playableCardRepository: PlayableCardRepository,
  ) {}

  insertManualCards(cardNames: string[]): Promise<InsertedResult> {
    if (!cardNames.length) {
      return Promise.resolve<InsertedResult>({
        inserted: [],
        alreadyPresent: [],
        notFound: [],
      });
    }

    return this.playableCardRepository.insertFromCardNames(cardNames);
  }

  insertAutomaticCards(): Promise<InsertedResult> {
    return this.playableCardRepository.insertAutomaticByEdhrcRank(500);
  }
}