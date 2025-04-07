import { Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SetService } from '../../models/set/set.service';
import { CardSet } from '../../models/set/set';
import { from, Observable, switchMap } from 'rxjs';

@ApiTags('set')
@Controller('set')
export class SetController {
  constructor(private readonly setService: SetService) {}

  @Get('scryfall')
  @ApiOkResponse({
    type: CardSet,
    isArray: true,
  })
  getAllFromScryfall() {
    return this.setService.getAllFromScryfall();
  }

  @Post('insertAllFromScryfall')
  @ApiCreatedResponse({
    type: CardSet,
    isArray: true,
  })
  insertAllFromScryfall(): Observable<CardSet[]> {
    return this.setService
      .getAllFromScryfall()
      .pipe(switchMap((data) => from(this.setService.bulkInsert(data))));
  }
}
