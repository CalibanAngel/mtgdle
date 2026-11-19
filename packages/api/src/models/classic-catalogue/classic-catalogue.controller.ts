import {
  Controller,
  DefaultValuePipe,
  ParseBoolPipe,
  Post,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { ClassicCatalogueService } from './classic-catalogue.service';

@Controller('admin/catalogue')
@AdminOnly()
export class ClassicCatalogueController {
  constructor(private readonly catalogue: ClassicCatalogueService) {}

  @Post('prepare')
  prepare(
    @Query('check', new DefaultValuePipe(false), ParseBoolPipe) check: boolean,
  ) {
    return this.catalogue.prepare(check);
  }
}
