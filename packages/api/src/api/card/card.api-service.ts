import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CardService } from '../../models/card/card.service';
import { Card } from '../../models/card/card';
import { IImportStats } from '@mtgdle/shared-types';

@Injectable()
export class CardApiService {
  constructor(private readonly cardService: CardService) {}

  async createFromScryfallId(id: string): Promise<Card[]> {
    const card = await firstValueFrom(this.cardService.getFromScryfallId(id));

    return this.cardService.createCard(card);
  }

  async importAllFromScryfall(local: boolean): Promise<IImportStats> {
    return this.cardService.importAllFromScryfall(local);
  }
}
