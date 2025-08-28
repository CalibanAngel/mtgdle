import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardImageUrisModule } from './card-image-uris/card-image-uris.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { CardRepository } from './card.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './card.schema';
import { ManaCostModule } from './mana-cost/mana-cost.module';
import { CardFaceModule } from './card-face/card-face.module';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardEntity]),
    CardImageUrisModule,
    ManaCostModule,
    CardFaceModule,
    InfrastructureModule,
  ],
  providers: [CardService, createCustomRepositoryProvider(CardRepository)],
  exports: [CardService],
})
export class CardModule {}
