import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CardService } from '@mtgdle/common/models/card/card.service';

@Injectable()
export class CardApiService {
  constructor(private readonly cardService: CardService) {}

  async createFromScryfallId(id: string) {
    const card = await firstValueFrom(this.cardService.getFromScryfallId(id));

    return this.cardService.createCard(card);
  }
}
