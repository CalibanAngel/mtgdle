import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, EntityMetadata } from 'typeorm';
import { isUUID } from 'class-validator';
import { ClassicStatus } from '@mtgdle/shared-types';
import type {
  AdminColumn,
  AdminDay,
  AdminRows,
  AdminTable,
} from '@mtgdle/shared-types';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';
import { ClassicProgress } from './classic-progress';
import { ClassicProgressEntity } from './classic-progress.schema';

const tables = new Map([
  ['card', 'Cartes'],
  ['set', 'Éditions'],
  ['playable_card', 'Cartes jouables'],
  ['card_face', 'Faces de cartes'],
  ['card_image_uris', 'Images'],
  ['mana_cost', 'Coûts de mana'],
  ['game', 'Défis historiques'],
  ['classic_catalogue', 'Catalogue Classic'],
  ['classic_daily', 'Défis Classic'],
  ['classic_progress', 'Progressions Classic'],
]);
@Injectable()
@CustomRepository(ClassicProgressEntity)
export class AdminRepository extends CustomRepositoryBase<ClassicProgress> {
  constructor(private readonly database: DataSource) {
    super(database);
  }
  private tableMetadata(table: string): EntityMetadata {
    const meta = this.database.entityMetadatas.find(
      (m) => m.tableName === table,
    );
    if (!tables.has(table) || !meta)
      throw new NotFoundException('Table non disponible.');
    return meta;
  }
  private columns(meta: EntityMetadata): AdminColumn[] {
    return meta.columns.map((c) => ({
      name: c.propertyName,
      type: `${typeof c.type === 'function' ? c.type.name : c.type}${c.isArray ? '[]' : ''}`,
      primary: c.isPrimary,
      nullable: c.isNullable,
    }));
  }
  async tables(): Promise<AdminTable[]> {
    return Promise.all(
      [...tables].map(async ([name, label]) => {
        const meta = this.tableMetadata(name);
        return {
          name,
          label,
          count: await this.database.getRepository(meta.target).count(),
          columns: this.columns(meta),
        };
      }),
    );
  }
  private tableQuery(meta: EntityMetadata) {
    const query = this.database
      .getRepository(meta.target)
      .createQueryBuilder('row');
    query.select([]);
    for (const column of meta.columns)
      query.addSelect(`row.${column.propertyPath}`, column.propertyName);
    return query;
  }
  async rows(
    table: string,
    options: {
      page: number;
      pageSize: number;
      q: string;
      sort?: string;
      order: 'ASC' | 'DESC';
    },
  ): Promise<AdminRows> {
    const meta = this.tableMetadata(table);
    const sort = meta.columns.find(
      (c) =>
        c.propertyName ===
        (options.sort || meta.primaryColumns[0].propertyName),
    );
    if (!sort || ['json', 'jsonb'].includes(String(sort.type)) || sort.isArray)
      throw new BadRequestException('Colonne de tri inconnue.');
    const query = this.tableQuery(meta);
    if (options.q.trim()) {
      const searchable = meta.columns.filter((c) =>
        ['text', 'varchar', 'uuid', 'enum', 'date', 'simple-array'].includes(
          String(c.type),
        ),
      );
      if (searchable.length)
        query.andWhere(
          new Brackets((sub) => {
            for (const column of searchable)
              sub.orWhere(
                `CAST(row.${column.propertyPath} AS text) ILIKE :search`,
              );
            if (table === 'classic_catalogue')
              sub.orWhere("(row.data ->> 'name') ILIKE :search");
          }),
          { search: `%${options.q.trim().replace(/[\\%_]/g, '\\$&')}%` },
        );
    }
    query.orderBy(`row.${sort.propertyPath}`, options.order);
    for (const key of meta.primaryColumns)
      if (key !== sort) query.addOrderBy(`row.${key.propertyPath}`, 'ASC');
    const total = await query.getCount();
    const rows: Record<string, unknown>[] = await query
      .offset((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .getRawMany();
    return {
      table,
      total,
      page: options.page,
      pageSize: options.pageSize,
      columns: this.columns(meta),
      rows: rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => {
            const text =
              typeof value === 'string' ? value : JSON.stringify(value);
            return [key, text?.length > 240 ? `${text.slice(0, 240)}…` : value];
          }),
        ),
      ),
    };
  }
  async row(table: string, keyText: string): Promise<Record<string, unknown>> {
    const meta = this.tableMetadata(table);
    let key: Record<string, unknown>;
    try {
      key = JSON.parse(keyText);
    } catch {
      throw new BadRequestException('Clé invalide.');
    }
    if (
      !key ||
      typeof key !== 'object' ||
      Array.isArray(key) ||
      Object.keys(key).length !== meta.primaryColumns.length ||
      meta.primaryColumns.some(
        (c) =>
          !(c.propertyName in key) ||
          typeof key[c.propertyName] !== 'string' ||
          (c.type === 'uuid' && !isUUID(key[c.propertyName])),
      )
    )
      throw new BadRequestException('Clé invalide.');
    const query = this.tableQuery(meta);
    for (const column of meta.primaryColumns)
      query.andWhere(`row.${column.propertyPath} = :${column.propertyName}`, {
        [column.propertyName]: key[column.propertyName],
      });
    const row = await query.getRawOne<Record<string, unknown>>();
    if (!row) throw new NotFoundException('Ligne introuvable.');
    return row;
  }
  async statistics(
    since: string,
    until: string,
  ): Promise<{
    days: AdminDay[];
    distribution: { guesses: number; count: number }[];
  }> {
    const query = this.createQueryBuilder('progress').where(
      'progress.day >= :since AND progress.day <= :until',
      { since, until },
    );
    const rows = await query
      .clone()
      .select('progress.day', 'day')
      .addSelect('COUNT(*)', 'sessions')
      .addSelect(
        'COUNT(*) FILTER (WHERE jsonb_array_length(progress.guesses) > 0)',
        'players',
      )
      .addSelect('COUNT(*) FILTER (WHERE progress.status = :won)', 'won')
      .addSelect(
        'COUNT(*) FILTER (WHERE progress.status = :abandoned)',
        'abandoned',
      )
      .addSelect('SUM(jsonb_array_length(progress.guesses))', 'guesses')
      .addSelect(
        'COALESCE(SUM(jsonb_array_length(progress.guesses)) FILTER (WHERE progress.status = :won), 0)',
        'winningGuesses',
      )
      .addSelect('COUNT(*) FILTER (WHERE progress.hintUsed)', 'reduceHints')
      .addSelect('COUNT(*) FILTER (WHERE progress.artUsed)', 'artHints')
      .addSelect('COUNT(*) FILTER (WHERE progress.textUsed)', 'textHints')
      .setParameters({
        won: ClassicStatus.Won,
        abandoned: ClassicStatus.Abandoned,
      })
      .groupBy('progress.day')
      .orderBy('progress.day', 'DESC')
      .getRawMany();
    const days = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          key === 'day' ? value : Number(value),
        ]),
      ),
    ) as unknown as AdminDay[];
    const distribution = await query
      .clone()
      .select('jsonb_array_length(progress.guesses)', 'guesses')
      .addSelect('COUNT(*)', 'count')
      .andWhere('progress.status = :won', { won: ClassicStatus.Won })
      .groupBy('jsonb_array_length(progress.guesses)')
      .orderBy('jsonb_array_length(progress.guesses)', 'ASC')
      .getRawMany();
    return {
      days,
      distribution: distribution.map((row) => ({
        guesses: Number(row.guesses),
        count: Number(row.count),
      })),
    };
  }
}
