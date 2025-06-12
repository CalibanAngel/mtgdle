import { Module } from '@nestjs/common';
import { SetController } from './set.controller';
import { SetApiService } from './set.api-service';
import { ScryfallSetModule } from '@mtgdle/common/dist/infrastructure/external/scryfall/set/scryfall-set.module';
import { ModelsModule } from '@mtgdle/common/dist/models/models.module';

@Module({
  imports: [ModelsModule, ScryfallSetModule],
  providers: [SetApiService],
  controllers: [SetController],
})
export class SetApiModule {}
