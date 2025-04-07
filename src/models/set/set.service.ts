import { ScryfallSetService } from '../../infrastructure/external/scryfall/set/scryfall-set.service';
import { Observable } from 'rxjs';
import { CardSet } from './set';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SetEntity } from './set.schema';

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name);

  constructor(
    @InjectRepository(SetEntity)
    private readonly cardSetRepository: Repository<CardSet>,
    private readonly scryfallSetService: ScryfallSetService,
  ) {}

  getAllFromScryfall(): Observable<CardSet[]> {
    this.logger.debug('Getting all sets from Scryfall API');

    return this.scryfallSetService.getAllSets();
  }

  async bulkInsert(sets: CardSet[]) {
    return this.cardSetRepository.insert(sets);
  }
}
