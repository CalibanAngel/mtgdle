import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CardApiService } from './card.api-service';
import { CardService } from '@mtgdle/common/dist/models/card/card.service';
import { Card } from '@mtgdle/common/dist/models/card/card';

@ApiTags('card')
@Controller('card')
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly cardApiService: CardApiService,
  ) {}

  @Get('/get-random-card-from-scryfall-api')
  @ApiOkResponse({ type: Card })
  getRandomCardFromScryfallApi() {
    return this.cardService.getRandomCardFromScryfallApi();
  }

  @Get('/get-by-scryfall-id/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID from Scryfall API',
  })
  @ApiOkResponse({ type: Card })
  getFromId(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardService.getFromScryfallId(id);
  }

  @Post('/create-by-scryfall-id/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID from Scryfall API',
  })
  @ApiCreatedResponse({ type: Card })
  createFromId(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardApiService.createFromScryfallId(id);
  }
}
