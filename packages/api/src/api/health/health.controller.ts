import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { HealthApiService } from './health.api-service';
import { ReadinessService } from './readiness.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthApiService: HealthApiService,
    private readonly readiness: ReadinessService,
  ) {}

  @Get('ready')
  ready() {
    return this.readiness.check();
  }

  @Get()
  @HealthCheck()
  check() {
    return this.healthApiService.areAllServicesAlive();
  }
}
