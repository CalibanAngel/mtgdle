import { Module } from '@nestjs/common';
import { ScryfallCardModule } from './card/scryfall-card.module';
import { ScryfallSetModule } from './set/scryfall-set.module';

@Module({
  imports: [ScryfallCardModule, ScryfallSetModule],
  exports: [ScryfallCardModule, ScryfallSetModule],
})
export class ScryfallModule {}
