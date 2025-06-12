import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthApiService } from './health.api-service';

@Module({
  imports: [TerminusModule, HttpModule],
  providers: [HealthApiService],
  controllers: [HealthController],
})
export class HealthApModule {}
