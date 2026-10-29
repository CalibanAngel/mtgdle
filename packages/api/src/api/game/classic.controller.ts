import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { ClassicStore } from './classic.store';

export class ClassicGuessDto {
  @IsUUID() cardId: string;
  @IsUUID() requestId: string;
}

@ApiTags('classic')
@Controller('classic')
export class ClassicController {
  constructor(private readonly store: ClassicStore) {}

  private session(req: Request, res: Response): string {
    const existing = req.headers.cookie
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('mtgdle_session='))
      ?.slice('mtgdle_session='.length);
    if (
      existing &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        existing,
      )
    )
      return existing;
    const id = randomUUID();
    res.cookie('mtgdle_session', id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: 365 * 86400000,
      path: '/',
    });
    return id;
  }

  @Get('today')
  today(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.store.state(this.session(req, res));
  }

  @Post(':day/guesses')
  guess(
    @Param('day') day: string,
    @Body() body: ClassicGuessDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.store.act(
      day,
      this.session(req, res),
      'guess',
      body.cardId,
      body.requestId,
    );
  }

  @Post(':day/hint')
  hint(
    @Param('day') day: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.store.act(day, this.session(req, res), 'hint');
  }

  @Post(':day/abandon')
  abandon(
    @Param('day') day: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.store.act(day, this.session(req, res), 'abandon');
  }
}
