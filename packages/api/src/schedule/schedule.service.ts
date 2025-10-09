import { Injectable } from '@nestjs/common';
import { GameService } from '../models/game/game.service';
import { WithLogger } from '../infrastructure/logging/with-logger.abstract';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleService extends WithLogger {
  constructor(private readonly gameService: GameService) {
    super()
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async createTodayScheduledGame(): Promise<void> {
    this.logger.log('Creating today scheduled game');

    await this.gameService.createNewTodayGame()
  }
}