import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CardService } from '../../models/card/card.service';

@Injectable()
export class CardApiService {
  constructor(private readonly cardService: CardService) {}

  async createFromScryfallId(id: string) {
    const card = await firstValueFrom(this.cardService.getFromScryfallId(id));

    return this.cardService.createCard(card);
  }

  async importAllFromScryfall(local: boolean) {
    return this.cardService.importAllFromScryfall(local);
  }
}
