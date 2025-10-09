import { Injectable } from '@nestjs/common';
import { WithLogger } from '../../infrastructure/logging/with-logger.abstract';
import { GameRepository } from './game.repository';
import { Game } from './game';
import { PlayableCardService } from '../playable-card/playable-card.service';

@Injectable()
export class GameService extends WithLogger {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly playableCardService: PlayableCardService,
  ) {
    super();
  }

  getTodayGame(): Promise<Game | null> {
    return this.gameRepository.getTodayGame();
  }

  async createNewTodayGame(): Promise<Game> {
    const randomPlayableCard = await this.playableCardService.getRandom();

    this.logger.log(`Creating game with card: ${randomPlayableCard.cardId}`);

    return this.gameRepository.save({
      cardId: randomPlayableCard.cardId,
    });
  }

  cardGuessed(): Promise<boolean> {
    return this.gameRepository.cardGuessed()
  }
}