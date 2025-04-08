import { Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CardSet } from '../../models/set/set';
import { Observable } from 'rxjs';
import { UpsertResult } from '../../infrastructure/database/database.interface';
import { SetApiService } from './set.api-service';

@ApiTags('set')
@Controller('set')
export class SetController {
  constructor(private readonly setApiService: SetApiService) {}

  @Post('insertAllFromScryfall')
  @ApiCreatedResponse({
    type: CardSet,
    isArray: true,
  })
  insertAllFromScryfall(): Observable<UpsertResult<CardSet>> {
    return this.setApiService.importScryfallSetToDatabase();
  }
}
