import { Injectable, Logger } from '@nestjs/common';
import { Configuration } from '../../../../../config/configuration';
import { ConfigService } from '@nestjs/config/dist';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallCard } from '@scryfall/api-types';

@Injectable()
export class ScrayfallCardDao {
  private readonly logger = new Logger(ScrayfallCardDao.name);
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    this.host = this.configService.get('scryfall.host', { infer: true });
  }

  getRandomCard(): Observable<AxiosResponse<ScryfallCard.Any>> {
    return this.httpService.get<ScryfallCard.Any>(`${this.host}/cards/random`);
  }
}
