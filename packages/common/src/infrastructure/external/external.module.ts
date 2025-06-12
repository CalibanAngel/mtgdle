import { Module } from '@nestjs/common';
import { ScryfallModule } from './scryfall/scryfall.module';

@Module({
  imports: [ScryfallModule],
  exports: [ScryfallModule],
})
export class ExternalModule {}
