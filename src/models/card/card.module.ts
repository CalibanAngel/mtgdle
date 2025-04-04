import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardImageUrisModule } from './card-image-uris/card-image-uris.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

@Module({
  imports: [CardImageUrisModule, InfrastructureModule],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
