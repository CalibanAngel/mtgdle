import {
  Controller,
  DefaultValuePipe,
  ParseBoolPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { ClassicCatalogueService } from './classic-catalogue.service';
import { ClassicCataloguePreparation } from './classic-catalogue';

@Controller('admin/catalogue')
@ApiTags('classic-catalogue')
@AdminOnly()
export class ClassicCatalogueController {
  constructor(private readonly catalogue: ClassicCatalogueService) {}

  @Post('prepare')
  @ApiOperation({
    summary: 'Prepare the Classic catalogue from the local Scryfall snapshot.',
  })
  @ApiQuery({
    name: 'check',
    required: false,
    type: Boolean,
    example: false,
    description: 'Validate preparation without writing when true.',
  })
  @ApiCreatedResponse({ type: ClassicCataloguePreparation })
  prepare(
    @Query('check', new DefaultValuePipe(false), ParseBoolPipe) check: boolean,
  ) {
    return this.catalogue.prepare(check);
  }
}
