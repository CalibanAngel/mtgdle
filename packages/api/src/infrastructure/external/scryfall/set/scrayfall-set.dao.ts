import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallList } from '@scryfall/api-types';
import { Configuration } from '../../../../config/config';

@Injectable()
export class ScrayfallSetDao {
  private readonly logger = new Logger(ScrayfallSetDao.name);
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    this.host = this.configService.getOrThrow('scryfall.host', { infer: true });
  }

  getAllSets(): Observable<AxiosResponse<ScryfallList.Sets>> {
    return this.httpService.get<ScryfallList.Sets>(`${this.host}/sets`);
  }
}
