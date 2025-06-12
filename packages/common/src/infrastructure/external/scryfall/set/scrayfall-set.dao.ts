import { Injectable, Logger } from '@nestjs/common';
import { Configuration } from '../../../../../config/configuration';
import { ConfigService } from '@nestjs/config/dist';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallList } from '@scryfall/api-types';

@Injectable()
export class ScrayfallSetDao {
  private readonly logger = new Logger(ScrayfallSetDao.name);
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    this.host = this.configService.get('scryfall.host', { infer: true });
  }

  getAllSets(): Observable<AxiosResponse<ScryfallList.Sets>> {
    return this.httpService.get<ScryfallList.Sets>(`${this.host}/sets`);
  }
}
