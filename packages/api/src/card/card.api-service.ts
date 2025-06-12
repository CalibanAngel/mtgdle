import { Injectable } from '@nestjs/common';
import { CardService } from '../../models/card/card.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CardApiService {
  constructor(private readonly cardService: CardService) {}

  async createFromScryfallId(id: string) {
    const card = await firstValueFrom(this.cardService.getFromScryfallId(id));

    return this.cardService.createCard(card);
  }
}
