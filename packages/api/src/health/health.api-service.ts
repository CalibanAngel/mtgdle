import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import type { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';
import type { Configuration } from '@mtgdle/common/config';

@Injectable()
export class HealthApiService {
  private readonly logger = new Logger(HealthApiService.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
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
