import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SetService } from '../../models/set/set.service';
import { CardSet } from '../../models/set/set';

@ApiTags('set')
@Controller('set')
export class SetController {
  constructor(private readonly setService: SetService) {}

  @Get()
  @ApiOkResponse({
    type: CardSet,
    isArray: true,
  })
  getAll() {
    return this.setService.getAll();
  }
}
