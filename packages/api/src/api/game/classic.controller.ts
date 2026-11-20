import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { IsUUID, IsIn, IsOptional } from 'class-validator';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { ClassicStore } from './classic.store';
import type { HintKind } from '@mtgdle/shared-types';
import { ClassicStateDto } from './classic-state.dto';
import { ClassicCatalogue } from '../../models/classic-catalogue/classic-catalogue';
import { ClassicDaily } from '../../models/classic-daily/classic-daily';
import { ClassicProgress } from '../../models/classic-progress/classic-progress';

export class ClassicHintDto {
  @ApiPropertyOptional({
    description: 'Hint to activate; defaults to choice reduction.',
    enum: ['reduce', 'art', 'text'],
    default: 'reduce',
  })
  @IsOptional()
  @IsIn(['reduce', 'art', 'text'])
  kind?: HintKind;
}

export class ClassicGuessDto {
  @ApiProperty({
    description: 'Oracle ID of the card selected from the daily choices.',
    format: 'uuid',
  })
  @IsUUID()
  cardId: string;

  @ApiProperty({
    description: 'Unique client request ID; reuse it to retry the same guess.',
    format: 'uuid',
  })
  @IsUUID()
  requestId: string;
}

@ApiTags('classic')
@ApiExtraModels(ClassicCatalogue, ClassicDaily, ClassicProgress)
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
  @ApiOperation({ summary: 'Open or resume today’s Classic challenge.' })
  @ApiOkResponse({ type: ClassicStateDto })
  @SerializeOptions({ type: ClassicStateDto })
  today(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.store.state(this.session(req, res));
  }

  @Post(':day/guesses')
  @ApiOperation({
    summary: 'Submit a card and compare it with the daily answer.',
  })
  @ApiParam({
    name: 'day',
    description: 'Challenge day in Europe/Paris.',
    schema: { type: 'string', format: 'date' },
  })
  @ApiCreatedResponse({ type: ClassicStateDto })
  @SerializeOptions({ type: ClassicStateDto })
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
  @ApiOperation({ summary: 'Activate an eligible hint for this session.' })
  @ApiParam({
    name: 'day',
    description: 'Challenge day in Europe/Paris.',
    schema: { type: 'string', format: 'date' },
  })
  @ApiCreatedResponse({ type: ClassicStateDto })
  @SerializeOptions({ type: ClassicStateDto })
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
  @ApiOperation({
    summary: 'Read the illustration after activating the art hint.',
  })
  @ApiParam({
    name: 'day',
    description: 'Challenge day in Europe/Paris.',
    schema: { type: 'string', format: 'date' },
  })
  @ApiProduces('image/jpeg', 'image/png')
  @ApiOkResponse({
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
    },
  })
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
      throw new ServiceUnavailableException({
        code: 'errorArt',
        message: 'Illustration indisponible.',
      });
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
      throw new ServiceUnavailableException({
        code: 'errorArt',
        message:
          'Impossible de charger l’illustration. Réessaie dans un instant.',
      });
    }
  }

  @Post(':day/abandon')
  @ApiOperation({ summary: 'Abandon the challenge and reveal its answer.' })
  @ApiParam({
    name: 'day',
    description: 'Challenge day in Europe/Paris.',
    schema: { type: 'string', format: 'date' },
  })
  @ApiCreatedResponse({ type: ClassicStateDto })
  @SerializeOptions({ type: ClassicStateDto })
  abandon(
    @Param('day') day: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.store.act(day, this.session(req, res), 'abandon');
  }
}
