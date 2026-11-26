import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AdminOnly } from '../../auth/admin-only.decorator';
import { AdminSessionService } from '../../auth/admin-session.service';
import { AdminService } from './admin.service';
import {
  AdminHealthDto,
  AdminJobDto,
  AdminJobRequestDto,
  AdminLoginDto,
  AdminRowDto,
  AdminRowQueryDto,
  AdminRowsDto,
  AdminRowsQueryDto,
  AdminSessionDto,
  AdminStatisticsDto,
  AdminStatisticsQueryDto,
  AdminTableDto,
} from './admin.dto';

const validate = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
@ApiTags('administration')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly sessions: AdminSessionService) {}
  @Get('session')
  @ApiOkResponse({ type: AdminSessionDto })
  session(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.sessions.session(req);
  }
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Open an eight-hour administrator session using a password.',
  })
  @ApiOkResponse({ type: AdminSessionDto })
  login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body(validate) body: AdminLoginDto,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.sessions.login(req, res, body.username, body.password);
  }
  @Post('logout')
  @HttpCode(204)
  @ApiOperation({ summary: 'Revoke the current administrator session.' })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    this.sessions.logout(req, res);
  }
}
@ApiTags('administration')
@ApiCookieAuth('admin-session')
@AdminOnly()
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}
  @Get('health')
  @ApiOkResponse({ type: AdminHealthDto })
  health() {
    return this.service.health();
  }
  @Get('statistics')
  @ApiOkResponse({ type: AdminStatisticsDto })
  statistics(@Query(validate) query: AdminStatisticsQueryDto) {
    return this.service.statistics(query.days);
  }
  @Get('database')
  @ApiOkResponse({ type: [AdminTableDto] })
  tables() {
    return this.service.tables();
  }
  @Get('database/:table/rows')
  @ApiOkResponse({ type: AdminRowsDto })
  rows(
    @Param('table') table: string,
    @Query(validate) query: AdminRowsQueryDto,
  ) {
    return this.service.rows(table, query);
  }
  @Get('database/:table/row')
  @ApiOkResponse({ type: AdminRowDto })
  async row(
    @Param('table') table: string,
    @Query(validate) query: AdminRowQueryDto,
  ) {
    return { data: await this.service.row(table, query.key) };
  }
  @Get('jobs')
  @ApiOkResponse({ type: [AdminJobDto] })
  jobs() {
    return this.service.jobs();
  }
  @Post('jobs')
  @ApiCreatedResponse({ type: AdminJobDto })
  @ApiOperation({
    summary:
      'Start one existing Nest administrative service and return its tracking ID.',
  })
  start(@Body(validate) body: AdminJobRequestDto) {
    return this.service.start(body);
  }
}
