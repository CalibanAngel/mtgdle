import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallList } from '@scryfall/api-types';
import { Configuration } from '../../../../config/config';
import { WithLogger } from '../../../logging/with-logger.abstract';

@Injectable()
export class ScrayfallSetDao extends WithLogger {
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    super();
    this.host = this.configService.getOrThrow('scryfall.host', { infer: true });
  }

  getAllSets(): Observable<AxiosResponse<ScryfallList.Sets>> {
    this.logger.debug('Getting all sets from Scryfall API');

    return this.httpService.get<ScryfallList.Sets>(`${this.host}/sets`);
  }
}
