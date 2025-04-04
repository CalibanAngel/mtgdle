import { Module } from '@nestjs/common';
import { SetController } from './set.controller';
import { ModelsModule } from '../../models/models.module';

@Module({
  imports: [ModelsModule],
  providers: [],
  controllers: [SetController],
})
export class SetApiModule {}
