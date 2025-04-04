import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { Observable } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(private readonly scryfallCardService: ScryfallCardService) {}

  toto(): Observable<Card> {
    const test = this.scryfallCardService.getRandomCard();

    test.subscribe(({ data }) => {
      console.log(data);
    });

    return {} as unknown as Observable<Card>;
  }
}
