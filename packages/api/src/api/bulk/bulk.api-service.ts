import { Injectable } from '@nestjs/common';
import { CardApiService } from '../card/card.api-service';
import { SetApiService } from '../set/set.api-service';
import { lastValueFrom } from 'rxjs';
import { ImportAllType } from './bulk.type';
import { PlayableCardApiService } from '../playable-card/playable-card.api-service';

@Injectable()
export class BulkApiService {
  constructor(
    private readonly cardApiService: CardApiService,
    private readonly setApiService: SetApiService,
    private readonly playableCardApiService: PlayableCardApiService,
  ) {}

  async importAll(onlyExpansion: boolean, local: boolean): Promise<ImportAllType> {
    const importedSets = await lastValueFrom(
      this.setApiService.importScryfallSetToDatabase(onlyExpansion),
    );
    const importedCards =
      await this.cardApiService.importAllFromScryfall(local);
    const importedPlayableCards = await this.playableCardApiService.insertAutomaticCards()

    return {
      sets: importedSets,
      cards: importedCards,
      playableCards: importedPlayableCards
    };
  }
}
