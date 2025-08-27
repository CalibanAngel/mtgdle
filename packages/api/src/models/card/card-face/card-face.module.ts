import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardFaceEntity } from './card-face.schema';

@Module({
  imports: [TypeOrmModule.forFeature([CardFaceEntity])],
})
export class CardFaceModule {}
