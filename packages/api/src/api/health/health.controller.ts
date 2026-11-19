import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { HealthApiService } from './health.api-service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthApiService: HealthApiService) {}

  @Get('database')
  @HealthCheck()
  database() {
    return this.healthApiService.checkDatabase();
  }

  @Get()
  @HealthCheck()
  check() {
    return this.healthApiService.areAllServicesAlive();
  }
}
