import {
  InsertedResult,
  UpsertResult,
} from '../../infrastructure/database/database.interface';
import { CardSet } from '../../models/set/set';
import { IImportStats } from '@mtgdle/shared-types';
import { ApiProperty } from '@nestjs/swagger';
import { ImportStats } from '../common/import-stats';

export class ImportAllType {
  @ApiProperty({
    description: 'Import all sets from scryfall',
    type: UpsertResult<CardSet>,
  })
  sets: UpsertResult<CardSet>;

  @ApiProperty({
    description: 'Import all cards from scryfall',
    type: ImportStats,
  })
  cards: IImportStats;

  @ApiProperty({
    description: 'Import playable cards',
    type: InsertedResult,
  })
  playableCards: InsertedResult;
}