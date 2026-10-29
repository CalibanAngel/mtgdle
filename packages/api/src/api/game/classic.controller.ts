import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsUUID, IsIn, IsOptional } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { ClassicStore } from './classic.store';
import type { HintKind } from '@mtgdle/shared-types';

export class ClassicHintDto {
  @IsOptional()
  @IsIn(['reduce', 'art', 'text'])
  kind?: HintKind;
}

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
    @Body() body: ClassicHintDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    return this.store.act(
      day,
      this.session(req, res),
      'hint',
      undefined,
      undefined,
      body?.kind ?? 'reduce',
    );
  }

  @Get(':day/art')
  async art(
    @Param('day') day: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const source = await this.store.artSource(day, this.session(req, res));
    const url = new URL(source);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'cards.scryfall.io' ||
      !url.pathname.startsWith('/art_crop/')
    )
      throw new ServiceUnavailableException('Illustration indisponible.');
    try {
      const image = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'MTGdle/0.1 (local game)',
          Accept: 'image/jpeg,image/png',
        },
      });
      const type = image.headers.get('content-type')?.split(';')[0];
      if (
        !image.ok ||
        !type ||
        !['image/jpeg', 'image/png'].includes(type) ||
        Number(image.headers.get('content-length')) > 10000000
      )
        throw new Error('Invalid image');
      const data = Buffer.from(await image.arrayBuffer());
      if (data.length > 10000000) throw new Error('Image too large');
      res.setHeader('Cache-Control', 'no-store');
      res.type(type).send(data);
    } catch {
      throw new ServiceUnavailableException(
        'Impossible de charger l’illustration. Réessaie dans un instant.',
      );
    }
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
