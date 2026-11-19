import { Injectable } from '@nestjs/common';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';
import { ClassicCatalogue } from './classic-catalogue';
import { ClassicCatalogueEntity } from './classic-catalogue.schema';
import { ClassicDailyEntity } from '../classic-daily/classic-daily.schema';
import { PlayableCardEntity } from '../playable-card/playable-card.schema';
import type { ClassicStoredCard } from './classic-card';

@Injectable()
@CustomRepository(ClassicCatalogueEntity)
export class ClassicCatalogueRepository extends CustomRepositoryBase<ClassicCatalogue> {
  async selectedNames(): Promise<string[]> {
    const rows = await this.manager
      .getRepository(PlayableCardEntity)
      .find({ select: { name: true } });
    return rows.map((row) => row.name);
  }

  async refresh(cards: ClassicStoredCard[]): Promise<void> {
    await this.manager.transaction(async (manager) => {
      await manager.getRepository(ClassicCatalogueEntity).upsert(
        cards.map((data) => ({ id: data.id, data })),
        ['id'],
      );
      const catalogue = new Map(cards.map((card) => [card.id, card]));
      const dailyRepository = manager.getRepository(ClassicDailyEntity);
      const snapshots = await dailyRepository
        .createQueryBuilder('daily')
        .setLock('pessimistic_write')
        .getMany();
      for (const snapshot of snapshots) {
        const enriched = snapshot.cards.map((card) => {
          const reference = catalogue.get(card.id);
          return reference
            ? {
                ...card,
                previewImage: reference.previewImage,
                artCrop: reference.artCrop,
                oracleText: reference.oracleText,
                rarity: reference.rarity,
              }
            : card;
        });
        await dailyRepository.update(
          { day: snapshot.day },
          { cards: enriched },
        );
      }
    });
  }
}
