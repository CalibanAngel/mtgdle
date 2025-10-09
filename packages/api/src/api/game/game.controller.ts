import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { GameApiService } from './game.api-service';

@Controller('game')
@ApiTags('game')
export class GameController {
  constructor(private readonly gameApiService: GameApiService) {}

  @ApiCreatedResponse({
    description: 'Create a new game for today',
  })
  @Post('today')
  async newTodayGame() {
    await this.gameApiService.createTodayGame();
  }
}