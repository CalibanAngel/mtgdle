import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../config/configuration';
import type { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';

@Injectable()
export class HealthApiService {
  private readonly logger = new Logger(HealthApiService.name);

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly configService: ConfigService<Configuration>,
  ) {}

  isScryfallAlive(): Promise<HealthCheckResult> {
    const scryfallApiHost = this.configService.get('scryfall.host', {
      infer: true,
    });

    return this.health.check([
      () => this.http.pingCheck('scryfall', `${scryfallApiHost}/symbology`),
    ]);
  }

  isDatabaseAlive(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.http.pingCheck('database', 'http://localhost:8080/health'),
    ]);
  }
}
