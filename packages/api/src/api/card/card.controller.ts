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

  @Get('/scryfall/random')
  @ApiOkResponse({ type: Card })
  getRandomCardFromScryfallApi() {
    return this.cardService.getRandomCardFromScryfallApi();
  }

  @Get('/scryfall/get/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID from Scryfall API',
  })
  @ApiOkResponse({ type: Card })
  getFromId(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardService.getFromScryfallId(id);
  }

  @Post('/scryfall/create/:id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID from Scryfall API',
  })
  @ApiCreatedResponse({ type: Card, isArray: true })
  createFromId(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardApiService.createFromScryfallId(id);
  }

  @Post('/scryfall/import')
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
