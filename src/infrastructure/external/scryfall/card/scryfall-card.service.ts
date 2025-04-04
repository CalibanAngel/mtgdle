import { Injectable, Logger } from '@nestjs/common';
import { ScrayfallCardDao } from './scrayfall-card.dao';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import { ScryfallCard } from '@scryfall/api-types';

@Injectable()
export class ScryfallCardService {
  private readonly logger = new Logger(ScryfallCardService.name);

  constructor(private readonly scryfallCardDao: ScrayfallCardDao) {}

  getRandomCard(): Observable<AxiosResponse<ScryfallCard.Any>> {
    return this.scryfallCardDao.getRandomCard();
  }
}
