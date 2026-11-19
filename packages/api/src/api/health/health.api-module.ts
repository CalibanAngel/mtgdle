import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthApiService } from './health.api-service';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [TerminusModule, HttpModule],
  providers: [HealthApiService, ReadinessService],
  controllers: [HealthController],
})
export class HealthApiModule {}
