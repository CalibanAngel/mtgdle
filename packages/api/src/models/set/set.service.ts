import { CardSet } from './set';
import { Injectable } from '@nestjs/common';
import { SetRepository } from './set.repository';
import { UpsertResult } from '../../infrastructure/database/database.interface';
import { WithLogger } from '../../infrastructure/logging/with-logger.abstract';

@Injectable()
export class SetService extends WithLogger {
  constructor(private readonly cardSetRepository: SetRepository) {
    super();
  }

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

  async getAll(): Promise<CardSet[]> {
    return this.cardSetRepository.find();
  }
}
