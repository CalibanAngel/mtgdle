import { Injectable } from '@nestjs/common';
import { PlayableCardService } from '../../models/playable-card/playable-card.service';
import { InsertedResult } from '../../infrastructure/database/database.interface';
import { PlayableCard } from '../../models/playable-card/playable-card';

@Injectable()
export class PlayableCardApiService {
  constructor(private readonly playableCardService: PlayableCardService) {}

  getAll(): Promise<PlayableCard[]> {
    return this.playableCardService.getAll()
  }

  insertManualCards(cardsName: string[]): Promise<InsertedResult> {
    return this.playableCardService.insertManualCards(cardsName);
  }

  insertAutomaticCards(): Promise<InsertedResult> {
    return this.playableCardService.insertAutomaticCards();
  }
}