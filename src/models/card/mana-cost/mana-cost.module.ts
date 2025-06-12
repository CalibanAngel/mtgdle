import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManaCostEntity } from './mana-cost.schema';

@Module({
  imports: [TypeOrmModule.forFeature([ManaCostEntity])],
})
export class ManaCostModule {}
