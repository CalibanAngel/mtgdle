import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SetApiService } from './set.api-service';
import { CardSet } from '@mtgdle/common/dist/models/set/set';
import { UpsertResult } from '@mtgdle/common/dist/infrastructure/database/database.interface';

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
}
