import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../config/configuration';
import type { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';

@Injectable()
export class HealthApiService {
  private readonly logger = new Logger(HealthApiService.name);

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private readonly configService: ConfigService<Configuration>,
  ) {}

  isScryfallAlive(): Promise<HealthIndicatorResult<'scryfall'>> {
    const scryfallApiHost = this.configService.get('scryfall.host', {
      infer: true,
    });

    return this.http.pingCheck('scryfall', `${scryfallApiHost}/symbology`);
  }

  isDatabaseAlive(): Promise<HealthIndicatorResult<'database'>> {
    return this.db.pingCheck('database');
  }

  areAllServicesAlive(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.isScryfallAlive(),
      () => this.isDatabaseAlive(),
    ]);
  }
}
