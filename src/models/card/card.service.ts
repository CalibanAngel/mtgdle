import { Injectable, Logger } from '@nestjs/common';
import { Card } from './card';
import { Observable, tap } from 'rxjs';
import { ScryfallCardService } from '../../infrastructure/external/scryfall/card/scryfall-card.service';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(private readonly scryfallCardService: ScryfallCardService) {}

  toto(): Observable<Card> {
    this.scryfallCardService
      .getRandomCard()
      .pipe(tap((data) => this.logger.log(data)))
      .subscribe();

    return {} as unknown as Observable<Card>;
  }
}
