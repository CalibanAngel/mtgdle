import { Controller, Get, ParseBoolPipe, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SetApiService } from './set.api-service';
import { CardSet } from '../../models/set/set';
import { UpsertResult } from '../../infrastructure/database/database.interface';

@ApiTags('set')
@Controller('set')
export class SetController {
  constructor(private readonly setApiService: SetApiService) {}

  @Post('insert-all-from-scryfall')
  @ApiQuery({
    name: 'onlyExpansion',
    type: Boolean,
    default: true,
    description: 'Only insert expansion sets',
  })
  @ApiCreatedResponse({
    type: CardSet,
    isArray: true,
  })
  insertAllFromScryfall(
    @Query('onlyExpansion', new ParseBoolPipe()) onlyExpansion: boolean,
  ): Observable<UpsertResult<CardSet>> {
    return this.setApiService.importScryfallSetToDatabase(onlyExpansion);
  }

  @Get()
  @ApiResponse({
    type: CardSet,
    isArray: true,
  })
  getAll(): Promise<CardSet[]> {
    return this.setApiService.getAll();
  }
}
