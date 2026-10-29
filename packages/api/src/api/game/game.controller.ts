import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { GameApiService } from './game.api-service';
import { ErrorContext } from '../../error/error-context.decorator';
import { PostgresErrorCode } from '../../error/error.mapping';
import { ErrorKey } from '../../error/error.types';

@Controller('game')
@ApiTags('game')
export class GameController {
  constructor(private readonly gameApiService: GameApiService) {}

  @ApiCreatedResponse({
    description: 'Create a new game for today',
  })
  @ErrorContext({
    context: 'CREATE_GAME',
    codeToKey: {
      [PostgresErrorCode.UNIQUE_VIOLATION]: ErrorKey.GAME_ALREADY_EXISTS,
    },
    fallback: { key: ErrorKey.INTERNAL_ERROR },
  })
  @Post('today')
  async newTodayGame() {
    await this.gameApiService.createTodayGame();
  }

  @Post('guess-card/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID from Scryfall API',
  })
  async guessCard(@Param('id', ParseUUIDPipe) id: string): Promise<unknown> {
    return this.gameApiService.guessCard(id);
  }
}