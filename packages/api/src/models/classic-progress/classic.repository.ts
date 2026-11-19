import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';
import { ClassicProgress } from './classic-progress';
import { ClassicProgressEntity } from './classic-progress.schema';
import { ClassicDaily } from '../classic-daily/classic-daily';
import { ClassicDailyEntity } from '../classic-daily/classic-daily.schema';
import { ClassicCatalogueEntity } from '../classic-catalogue/classic-catalogue.schema';
import type { ClassicCard } from '../classic-catalogue/classic-card';

// All repositories in a transaction share its EntityManager and row locks.
export class ClassicTransaction {
  constructor(private readonly manager: EntityManager) {}

  findDaily(day: string): Promise<ClassicDaily | null> {
    return this.manager.getRepository(ClassicDailyEntity).findOneBy({ day });
  }

  async catalogueCards(): Promise<ClassicCard[]> {
    const rows = await this.manager
      .getRepository(ClassicCatalogueEntity)
      .find({ order: { id: 'ASC' } });
    return rows.map((row) => row.data);
  }

  async insertDaily(
    day: string,
    answerId: string,
    cards: ClassicCard[],
  ): Promise<void> {
    // The unique day key arbitrates concurrent creators; the persisted winner is
    // always read back before presenting a challenge to either player.
    await this.manager
      .getRepository(ClassicDailyEntity)
      .createQueryBuilder()
      .insert()
      .values({ day, answerId, cards })
      .orIgnore()
      .execute();
  }

  async progressForUpdate(
    day: string,
    sessionId: string,
  ): Promise<ClassicProgress> {
    const repository = this.manager.getRepository(ClassicProgressEntity);
    await repository
      .createQueryBuilder()
      .insert()
      .values({ day, sessionId })
      .orIgnore()
      .execute();
    return repository.findOneOrFail({
      where: { day, sessionId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async saveProgress(progress: ClassicProgress): Promise<void> {
    await this.manager.getRepository(ClassicProgressEntity).save(progress);
  }

  listProgress(day: string): Promise<ClassicProgress[]> {
    return this.manager.getRepository(ClassicProgressEntity).find({
      where: { day },
      select: { sessionId: true, status: true, guesses: true },
    });
  }
}

@Injectable()
@CustomRepository(ClassicProgressEntity)
export class ClassicRepository extends CustomRepositoryBase<ClassicProgress> {
  constructor(private readonly database: DataSource) {
    super(database);
  }

  transaction<T>(
    work: (transaction: ClassicTransaction) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction((manager) =>
      work(new ClassicTransaction(manager)),
    );
  }
}
