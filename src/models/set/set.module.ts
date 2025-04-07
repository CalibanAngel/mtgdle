import { Module } from '@nestjs/common';
import { SetService } from './set.service';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardSet } from './set';

@Module({
  imports: [TypeOrmModule.forFeature([CardSet]), InfrastructureModule],
  providers: [SetService],
  exports: [SetService],
})
export class SetModule {}
