import { Module } from '@nestjs/common';
import { SetService } from './set.service';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SetEntity } from './set.schema';
import { SetRepository } from './set.repository';
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SetEntity]), InfrastructureModule],
  providers: [
    SetService,
    {
      provide: SetRepository,
      inject: [DataSource],
      useFactory: (dataSource: DataSource) => new SetRepository(dataSource),
    },
  ],
  exports: [SetService],
})
export class SetModule {}
