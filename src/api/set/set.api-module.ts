import { Module } from '@nestjs/common';
import { SetController } from './set.controller';
import { ModelsModule } from '../../models/models.module';
import { SetApiService } from './set.api-service';

@Module({
  imports: [ModelsModule],
  providers: [SetApiService],
  controllers: [SetController],
})
export class SetApiModule {}
