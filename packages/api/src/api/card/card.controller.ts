import {
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CardApiService } from './card.api-service';
import { CardService } from '../../models/card/card.service';
import { Card } from '../../models/card/card';
import { ImportStats } from '../common/import-stats';

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
  @ApiCreatedResponse({ type: Card, isArray: true })
  createFromId(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardApiService.createFromScryfallId(id);
  }

  @Post('/import-all-from-scryfall')
  @ApiQuery({
    name: 'local',
    type: Boolean,
    default: true,
    description: 'insert from local file',
  })
  @ApiCreatedResponse({
    description: 'Summary of the import job',
    type: ImportStats,
  })
  importAllFromScryfall(@Query('local', new ParseBoolPipe()) local: boolean) {
    return this.cardApiService.importAllFromScryfall(local);
  }
}
