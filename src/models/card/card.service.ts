import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../config/configuration';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {}

  toto(): Observable<AxiosResponse<Card>> {
    const host = this.configService.get('scryfall.host', { infer: true });
    return this.httpService.get<Card>(`${host}/cards/random`);
  }
}
