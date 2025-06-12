import { Module } from '@nestjs/common';
import { SetController } from './set.controller';
import { ModelsModule } from '../../models/models.module';
import { SetApiService } from './set.api-service';
import { ScryfallSetModule } from '../../infrastructure/external/scryfall/set/scryfall-set.module';

@Module({
  imports: [ModelsModule, ScryfallSetModule],
  providers: [SetApiService],
  controllers: [SetController],
})
export class SetApiModule {}
