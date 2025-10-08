import { Controller, ParseBoolPipe, Post, Query } from '@nestjs/common';
import { BulkApiService } from './bulk.api-service';
import { ApiCreatedResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ImportAllType } from './bulk.type';

@Controller()
@ApiTags('bulk')
export class BulkController {
  constructor(private readonly bulkApiService: BulkApiService) {}

  @Post('scryfall/import/all')
  @ApiQuery({
    name: 'local',
    type: Boolean,
    default: true,
    description: 'insert from local file',
  })
  @ApiQuery({
    name: 'onlyExpansion',
    type: Boolean,
    default: true,
    description: 'Only insert expansion sets',
  })
  @ApiCreatedResponse({
    type: ImportAllType,
    description: 'Import all from scryfall',
  })
  importAll(
    @Query('local', new ParseBoolPipe()) local: boolean,
    @Query('onlyExpansion', new ParseBoolPipe()) onlyExpansion: boolean,
  ) {
    return this.bulkApiService.importAll(onlyExpansion, local);
  }
}
