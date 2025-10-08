import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { CardApiModule } from '../card/card.api-module';
import { SetApiModule } from '../set/set.api-module';
import { BulkApiService } from './bulk.api-service';
import { PlayableCardApiModule } from '../playable-card/playable-card.api-module';

@Module({
  controllers: [BulkController],
  providers: [BulkApiService],
  imports: [CardApiModule, SetApiModule, PlayableCardApiModule],
})
export class BulkApiModule {}