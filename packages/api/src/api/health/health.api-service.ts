import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import type { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';
import { Configuration } from '../../config/config';
import { WithLogger } from '../../infrastructure/logging/with-logger.abstract';

@Injectable()
export class HealthApiService extends WithLogger {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: TypeOrmHealthIndicator,
    private readonly configService: ConfigService<Configuration>,
  ) {
    super();
  }

  async isScryfallAlive(): Promise<HealthIndicatorResult<'scryfall'>> {
    const scryfallApiHost = this.configService.getOrThrow('scryfall.host', {
      infer: true,
    });

    const ping = await this.http.pingCheck(
      'scryfall',
      `${scryfallApiHost}/symbology`,
    );

    if (ping.scryfall.status === 'down') {
      this.logger.error('Scryfall API is down');
    }

    return ping;
  }

  async isDatabaseAlive(): Promise<HealthIndicatorResult<'database'>> {
    const ping = await this.db.pingCheck('database');

    if (ping.database.status === 'down') {
      this.logger.error('Database is down');
    }

    return ping;
  }

  areAllServicesAlive(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.isScryfallAlive(),
      () => this.isDatabaseAlive(),
    ]);
  }
}
