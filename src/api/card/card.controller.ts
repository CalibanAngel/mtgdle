import { Controller, Get } from '@nestjs/common';
import { CardService } from '../../models/card/card.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Card } from '../../models/card/card';

@ApiTags('card')
@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  @ApiOkResponse({ type: Card })
  toto() {
    return this.cardService.toto();
  }
}
