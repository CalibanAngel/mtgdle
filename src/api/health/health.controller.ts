import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../config/configuration';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private readonly configService: ConfigService<Configuration>,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const scryfallApiHost = this.configService.get('scryfall.host', {
      infer: true,
    });

    return this.health.check([
      () => this.http.pingCheck('scryfall', `${scryfallApiHost}/symbology`),
    ]);
  }
}
