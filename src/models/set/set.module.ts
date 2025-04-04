import { Module } from '@nestjs/common';
import { SetService } from './set.service';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [SetService],
  exports: [SetService],
})
export class SetModule {}
