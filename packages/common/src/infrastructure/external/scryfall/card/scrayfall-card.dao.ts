import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallCard } from '@scryfall/api-types';
import type { Configuration } from '@mtgdle/common/config';

@Injectable()
export class ScrayfallCardDao {
  private readonly logger = new Logger(ScrayfallCardDao.name);
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    this.host = this.configService.getOrThrow('scryfall.host', { infer: true });
  }

  getRandomCard(): Observable<AxiosResponse<ScryfallCard.AnySingleFaced>> {
    return this.httpService.get<ScryfallCard.AnySingleFaced>(
      `${this.host}/cards/random`,
    );
  }

  getCardById(
    id: string,
  ): Observable<AxiosResponse<ScryfallCard.AnySingleFaced>> {
    return this.httpService.get<ScryfallCard.AnySingleFaced>(
      `${this.host}/cards/${id}`,
    );
  }
}
