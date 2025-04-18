import { CardSet } from './set';
import { Injectable, Logger } from '@nestjs/common';
import { SetRepository } from './set.repository';
import { UpsertResult } from '../../infrastructure/database/database.interface';

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name);

  constructor(private readonly cardSetRepository: SetRepository) {}

  async bulkInsert(sets: CardSet[]): Promise<UpsertResult<CardSet>> {
    this.logger.debug(`Inserting ${sets.length} sets into database`);

    const upsertedResult = await this.cardSetRepository.upsertBulk(sets);

    this.logger.debug(
      `Inserted ${upsertedResult.inserted.length} sets into database`,
    );
    this.logger.debug(
      `Updated ${upsertedResult.updated.length} sets into database`,
    );

    return upsertedResult;
  }
}
