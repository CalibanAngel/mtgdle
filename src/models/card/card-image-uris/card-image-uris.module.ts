import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardImageUrisEntity } from './card-image-uris.schema';

@Module({
  imports: [TypeOrmModule.forFeature([CardImageUrisEntity])],
})
export class CardImageUrisModule {}
