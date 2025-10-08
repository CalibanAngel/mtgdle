import { Injectable } from '@nestjs/common';
import { PlayableCardService } from '../../models/playable-card/playable-card.service';
import { InsertedResult } from '../../infrastructure/database/database.interface';

@Injectable()
export class PlayableCardApiService {
  constructor(private readonly playableCardService: PlayableCardService) {}

  insertManualCards(cardsName: string[]): Promise<InsertedResult> {
    return this.playableCardService.insertManualCards(cardsName);
  }

  insertAutomaticCards(): Promise<InsertedResult> {
    return this.playableCardService.insertAutomaticCards();
  }
}