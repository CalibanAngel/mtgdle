import { Card } from './card';
import { Injectable } from '@nestjs/common';
import { CardEntity } from './card.schema';
import { CustomRepository } from '../../repository/custom-repository.decorator';
import { CustomRepositoryBase } from '../../repository/custom-repository.absctract';

@Injectable()
@CustomRepository(CardEntity)
export class CardRepository extends CustomRepositoryBase<Card> {
  createCard(card: Card): Promise<Card> {
    return this.save(card);
  }
}
