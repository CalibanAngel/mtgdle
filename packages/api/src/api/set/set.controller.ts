import { Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SetApiService } from './set.api-service';
import { CardSet } from '../../models/set/set';
import { UpsertResult } from '../../infrastructure/database/database.interface';

@ApiTags('set')
@Controller('set')
export class SetController {
  constructor(private readonly setApiService: SetApiService) {}

  @Post('insert-all-from-scryfall')
  @ApiCreatedResponse({
    type: CardSet,
    isArray: true,
  })
  insertAllFromScryfall(): Observable<UpsertResult<CardSet>> {
    return this.setApiService.importScryfallSetToDatabase();
  }

  @Get()
  @ApiResponse({
    type: CardSet,
    isArray: true,
  })
  getAll(): Promise<CardSet[]> {
    return this.setApiService.getAll()
  }
}
