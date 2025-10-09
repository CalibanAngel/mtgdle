import { Injectable } from '@nestjs/common';
import { GameService } from '../../models/game/game.service';
import { Game } from '../../models/game/game';

@Injectable()
export class GameApiService {
  constructor(private readonly gameService: GameService) {
  }

  createTodayGame(): Promise<Game> {
    return this.gameService.createNewTodayGame()
  }
}