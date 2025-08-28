import { Module } from '@nestjs/common';
import { SetService } from './set.service';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetEntity } from './set.schema';
import { SetRepository } from './set.repository';
import { createCustomRepositoryProvider } from '../../repository/custom-repository.helper';

@Module({
  imports: [TypeOrmModule.forFeature([SetEntity]), InfrastructureModule],
  providers: [SetService, createCustomRepositoryProvider(SetRepository)],
  exports: [SetService],
})
export class SetModule {}
