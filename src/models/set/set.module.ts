import { Module } from '@nestjs/common';
import { SetService } from './set.service';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetEntity } from './set.schema';

@Module({
  imports: [TypeOrmModule.forFeature([SetEntity]), InfrastructureModule],
  providers: [SetService],
  exports: [SetService],
})
export class SetModule {}
