import { GameController } from './game.controller';
import { GameApiService } from './game.api-service';
import { Module } from '@nestjs/common';
import { GameModule } from '../../models/game/game.module';
import { ClassicController } from './classic.controller';
import { ClassicStore } from './classic.store';

@Module({
  controllers: [GameController, ClassicController],
  providers: [GameApiService, ClassicStore],
  imports: [GameModule],
})
export class GameApiModule {}
