import { Injectable } from '@nestjs/common';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';
import { PlayableCardEntity } from './playable-card.schema';
import { PlayableCard } from './playable-card';
import { InsertType } from './playable-card.enum';
import {
  InsertedResult,
  InsertedStatus,
} from '../../infrastructure/database/database.interface';

export type InsertFromNamesRow = {
  name: string;
  status: InsertedStatus;
};

@Injectable()
@CustomRepository(PlayableCardEntity)
export class PlayableCardRepository extends CustomRepositoryBase<PlayableCard> {
  private readonly tableName = PlayableCardEntity.options.tableName;

  async insertFromCardNames(cardNames: string[]): Promise<InsertedResult> {
    const sql = `
      WITH input(name) AS (
        SELECT unnest($1::text[])
      ),
           dedup AS (
             SELECT DISTINCT name FROM input
           ),
           matched AS (
             SELECT DISTINCT ON (c.name)
               d.name,
               c.id AS card_id
             FROM dedup d
                    JOIN "card" c ON c.name = d.name
             ORDER BY c.name, c.released_date ASC, c.id ASC
           ),
           ins AS (
             INSERT INTO ${this.tableName} (card_id, insert_type, name)
               SELECT m.card_id, $2::insert_type_enum, m.name
               FROM matched m
               ON CONFLICT (name) DO NOTHING
               RETURNING name
           ),
           inserted AS (
             SELECT m.name
             FROM matched m
                    JOIN ins i ON i.name = m.name
           ),
           already AS (
             SELECT m.name
             FROM matched m
                    LEFT JOIN ins i ON i.name = m.name
             WHERE i.name IS NULL
           ),
           not_found AS (
             SELECT d.name
             FROM dedup d
                    LEFT JOIN matched m ON m.name = d.name
             WHERE m.card_id IS NULL
           )
      SELECT name, '${InsertedStatus.INSERTED}' AS status FROM inserted
      UNION ALL
      SELECT name, '${InsertedStatus.ALREADY_PRESENT}' AS status FROM already
      UNION ALL
      SELECT name, '${InsertedStatus.NOT_FOUND}' AS status FROM not_found
    `;

    const rows = await this.manager.query<InsertFromNamesRow[]>(sql, [
      cardNames,
      InsertType.MANUAL,
    ]);

    const inserted: string[] = [];
    const alreadyPresent: string[] = [];
    const notFound: string[] = [];

    for (const row of rows) {
      if (row.status === InsertedStatus.INSERTED) inserted.push(row.name);
      else if (row.status === InsertedStatus.ALREADY_PRESENT)
        alreadyPresent.push(row.name);
      else notFound.push(row.name);
    }

    return { inserted, alreadyPresent, notFound };
  }

  async insertAutomaticByEdhrcRank(
    rankThreshold: number,
  ): Promise<InsertedResult> {
    const sql = `
      WITH matched AS (
        SELECT DISTINCT ON (c.name)
          c.name,
          c.id AS card_id
        FROM "card" c
        WHERE c.edhrc_rank IS NOT NULL
          AND c.edhrc_rank <= $1
        ORDER BY c.name, c.released_date ASC, c.id ASC
      ),
           ins AS (
             INSERT INTO ${this.tableName} (card_id, insert_type, name)
               SELECT m.card_id, $2::insert_type_enum, m.name
               FROM matched m
               ON CONFLICT (name) DO NOTHING
               RETURNING name
           ),
           inserted AS (
             SELECT m.name
             FROM matched m
                    JOIN ins i ON i.name = m.name
           ),
           already AS (
             SELECT m.name
             FROM matched m
                    LEFT JOIN ins i ON i.name = m.name
             WHERE i.name IS NULL
           )
      SELECT name, '${InsertedStatus.INSERTED}' AS status FROM inserted
      UNION ALL
      SELECT name, '${InsertedStatus.ALREADY_PRESENT}' AS status FROM already
    `;

    const rows = await this.manager.query<InsertFromNamesRow[]>(sql, [
      rankThreshold,
      InsertType.AUTO,
    ]);

    const inserted: string[] = [];
    const alreadyPresent: string[] = [];

    for (const row of rows) {
      if (row.status === InsertedStatus.INSERTED) inserted.push(row.name);
      else alreadyPresent.push(row.name);
    }

    return { inserted, alreadyPresent, notFound: [] };
  }
}
