import { Injectable } from '@nestjs/common';
import { SetEntity } from './set.schema';
import { CardSet } from './set';
import { UpsertResult } from '../../infrastructure/database/database.interface';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';

@Injectable()
@CustomRepository(SetEntity)
export class SetRepository extends CustomRepositoryBase<CardSet> {
  async upsertBulk(sets: CardSet[]): Promise<UpsertResult<CardSet>> {
    const qb = this.createQueryBuilder()
      .insert()
      .into(SetEntity)
      .values(sets)
      .orUpdate(['cardCount'], ['code'], {
        upsertType: 'on-conflict-do-update',
        skipUpdateIfNoValuesChanged: true,
      })
      // The returning clause uses xmax to detect updated rows:
      // xmax = 0 means the row was inserted;
      // xmax != 0 indicates an update.
      .returning(
        "*, CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END AS op",
      );

    const result = await qb.execute();
    const rows = result.raw as (CardSet & { op: string })[];

    const inserted = rows.filter((row) => row.op === 'inserted');
    const updated = rows.filter((row) => row.op === 'updated');

    return { inserted, updated };
  }
}
