import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PlayableCardApiService } from './playable-card.api-service';
import { InsertManualCardsDto } from './playable-card.dto';
import { PlayableCard } from '../../models/playable-card/playable-card';
import { InsertedResult } from '../../infrastructure/database/database.interface';

@ApiTags('playable-cards')
@Controller('playable-cards')
export class PlayableCardController {
  constructor(
    private readonly playableCardApiService: PlayableCardApiService,
  ) {}

  @Get()
  @ApiResponse({
    type: PlayableCard,
    isArray: true,
  })
  getAll() {
    return this.playableCardApiService.getAll();
  }

  @Post('manual')
  @ApiBody({
    type: InsertManualCardsDto,
  })
  @ApiCreatedResponse({
    type: InsertedResult
  })
  insertManualCards(@Body() { cardsName }: InsertManualCardsDto): Promise<InsertedResult> {
    return this.playableCardApiService.insertManualCards(cardsName);
  }

  @Post('automatic')
  @ApiCreatedResponse({
    type: InsertedResult
  })
  insertAutomaticCards(): Promise<InsertedResult> {
    return this.playableCardApiService.insertAutomaticCards();
  }
}