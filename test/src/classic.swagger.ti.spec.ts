import { Test } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  type INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import request from 'supertest';
import { ClassicController } from '../../packages/api/src/api/game/classic.controller';
import { ClassicStore } from '../../packages/api/src/api/game/classic.store';
import { ClassicCard } from '../../packages/api/src/models/classic-catalogue/classic-card';
import { ClassicCatalogue } from '../../packages/api/src/models/classic-catalogue/classic-catalogue';
import { ClassicCatalogueController } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.controller';
import { ClassicCatalogueService } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.service';
import { ClassicDaily } from '../../packages/api/src/models/classic-daily/classic-daily';
import { ClassicProgress } from '../../packages/api/src/models/classic-progress/classic-progress';

describe('Classic OpenAPI documentation and serialization', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  const state = jest.fn();
  const card = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Example Card',
    image: null,
    previewImage: '/preview.jpg',
    identity: ['U'],
    mana: 1,
    types: ['Instant'],
    edition: 'Example Set',
    rarity: 'common',
    released: '2000-01-01',
    keywords: [],
    activated: false,
    artCrop: 'private-art-source',
    oracleText: 'private-oracle-text',
  };
  const guess = {
    requestId: '00000000-0000-4000-8000-000000000002',
    card,
    won: false,
    matches: {
      identity: 'exact',
      mana: 'higher',
      types: 'exact',
      edition: 'different',
      period: 'higher',
      keywords: 'exact',
      activated: 'exact',
      rarity: 'exact',
    },
  };
  const playing = {
    day: '2026-11-19',
    expiresAt: '2026-11-19T23:00:00.000Z',
    status: 'playing',
    guesses: [guess],
    choices: [
      {
        id: card.id,
        name: card.name,
        image: card.image,
        previewImage: card.previewImage,
      },
    ],
    hint: { available: false, used: false, removed: 0 },
    hints: [
      {
        kind: 'text',
        threshold: 20,
        used: true,
        available: false,
        text: '[cette carte] draws a card.',
      },
    ],
  };
  const schema = (name: string) =>
    document.components!.schemas![name] as SchemaObject;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ClassicController, ClassicCatalogueController],
      providers: [
        { provide: ClassicStore, useValue: { state } },
        { provide: ClassicCatalogueService, useValue: {} },
        { provide: ConfigService, useValue: { get: () => '' } },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Classic test').setVersion('1').build(),
    );
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    state.mockResolvedValue(playing);
  });

  it('generates concrete card, choice, comparison and conditional state schemas', () => {
    expect(schema('ClassicCard').properties!.id).toMatchObject({
      type: 'string',
      format: 'uuid',
    });
    expect(schema('ClassicCard').properties!.image).toMatchObject({
      type: 'string',
      nullable: true,
    });
    expect(Object.keys(schema('ClassicChoiceDto').properties!)).toEqual([
      'id',
      'name',
      'image',
      'previewImage',
    ]);
    expect(Object.keys(schema('ClassicComparison').properties!)).toContain(
      'rarity',
    );
    expect(schema('ClassicStateDto').required).not.toContain('answer');
    expect(schema('ClassicStateDto').required).not.toContain('statistics');
    expect(schema('ClassicStateDto').properties!.answer).toMatchObject({
      description: expect.stringContaining('victory'),
    });
  });

  it('documents the actual JSON response schemas for all game operations', () => {
    const response = {
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ClassicStateDto' },
        },
      },
    };
    expect(
      document.paths['/classic/today'].get!.responses['200'],
    ).toMatchObject(response);
    for (const operation of ['guesses', 'hint', 'abandon']) {
      expect(
        document.paths[`/classic/{day}/${operation}`].post!.responses['201'],
      ).toMatchObject(response);
    }
    expect(
      document.paths['/admin/catalogue/prepare'].post!.responses['201'],
    ).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ClassicCataloguePreparation' },
        },
      },
    });
    expect(schema('ClassicGuessDto').required).toEqual(['cardId', 'requestId']);
    expect(schema('ClassicGuessDto').properties!.requestId).toMatchObject({
      format: 'uuid',
    });
    expect(schema('ClassicHintDto').required || []).not.toContain('kind');
  });

  it('documents illustration bytes as image content rather than a JSON object', () => {
    expect(
      document.paths['/classic/{day}/art'].get!.responses['200'],
    ).toMatchObject({
      content: {
        'image/jpeg': { schema: { type: 'string', format: 'binary' } },
        'image/png': { schema: { type: 'string', format: 'binary' } },
      },
    });
  });

  it('hides private hint sources and storage identifiers from Swagger', () => {
    for (const name of ['artCrop', 'oracleText'])
      expect(schema('ClassicCard').properties).not.toHaveProperty(name);
    for (const name of ['answerId', 'cards'])
      expect(schema('ClassicDaily').properties).not.toHaveProperty(name);
    for (const name of [
      'sessionId',
      'removed',
      'hintUsed',
      'artUsed',
      'textUsed',
      'daily',
    ]) {
      expect(schema('ClassicProgress').properties).not.toHaveProperty(name);
    }
  });

  it('retains private fields for business use but excludes them from nested serialization', () => {
    const catalogue = plainToInstance(ClassicCatalogue, {
      id: card.id,
      data: card,
    });
    expect(catalogue.data).toBeInstanceOf(ClassicCard);
    expect(catalogue.data.oracleText).toBe(card.oracleText);
    expect(instanceToPlain(catalogue).data).toMatchObject({
      id: card.id,
      name: card.name,
    });
    expect(instanceToPlain(catalogue).data).not.toHaveProperty('oracleText');
    expect(instanceToPlain(catalogue).data).not.toHaveProperty('artCrop');
    const daily = plainToInstance(ClassicDaily, {
      day: playing.day,
      answerId: card.id,
      cards: [card],
      rulesVersion: 1,
    });
    expect(instanceToPlain(daily)).toEqual({
      day: playing.day,
      rulesVersion: 1,
    });
    const progress = plainToInstance(ClassicProgress, {
      day: playing.day,
      sessionId: 'private-session',
      daily,
      guesses: [guess],
      status: 'playing',
      removed: [card.id],
      hintUsed: true,
      artUsed: true,
      textUsed: true,
    });
    const serialized = instanceToPlain(progress);
    expect(serialized).not.toHaveProperty('sessionId');
    expect(serialized).not.toHaveProperty('daily');
    expect(serialized.guesses[0].card).not.toHaveProperty('oracleText');
  });

  it('applies exclusions to real HTTP responses without losing an activated text hint', async () => {
    const response = await request(app.getHttpServer())
      .get('/classic/today')
      .expect(200);
    expect(response.body.guesses[0].card.name).toBe(card.name);
    expect(response.body.guesses[0].card).not.toHaveProperty('artCrop');
    expect(response.body.guesses[0].card).not.toHaveProperty('oracleText');
    expect(response.body.hints[0].text).toBe('[cette carte] draws a card.');
    expect(response.body).not.toHaveProperty('answer');
    expect(response.body).not.toHaveProperty('statistics');
  });

  it('serializes the revealed answer and nullable statistics after the game ends', async () => {
    state.mockResolvedValue({
      ...playing,
      status: 'won',
      answer: card,
      statistics: {
        participants: 0,
        solved: 0,
        abandoned: 0,
        averageWinningGuesses: null,
        guessPercentages: {},
      },
    });
    const response = await request(app.getHttpServer())
      .get('/classic/today')
      .expect(200);
    expect(response.body.answer.name).toBe(card.name);
    expect(response.body.answer).not.toHaveProperty('oracleText');
    expect(response.body.answer).not.toHaveProperty('artCrop');
    expect(response.body.statistics.averageWinningGuesses).toBeNull();
  });
});
