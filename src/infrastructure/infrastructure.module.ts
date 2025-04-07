import { Module } from '@nestjs/common';
import { ExternalModule } from './external/external.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [ExternalModule, DatabaseModule],
  exports: [ExternalModule, DatabaseModule],
})
export class InfrastructureModule {}
