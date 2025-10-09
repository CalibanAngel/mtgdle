import { GameController } from './game.controller';
import { GameApiService } from './game.api-service';
import { Module } from '@nestjs/common';
import { GameModule } from '../../models/game/game.module';

@Module({
  controllers: [GameController],
  providers: [GameApiService],
  imports: [GameModule]
})
export class GameApiModule {}