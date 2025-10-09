import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ModelsModule } from '../models/models.module';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [NestScheduleModule.forRoot(), ModelsModule],
  providers: [ScheduleService],
})
export class ScheduleModule {}