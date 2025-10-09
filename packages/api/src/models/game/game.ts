import { ApiProperty } from '@nestjs/swagger';
import { Card } from '../card/card';
import { Exclude } from 'class-transformer';

export class Game {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Date of the guessed card',
  })
  guessDate: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Card to guess',
  })
  cardId: string;

  @Exclude()
  card: Card;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'How many time the card have been guessed',
  })
  numberOfGuess: number;
}