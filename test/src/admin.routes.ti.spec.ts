import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { BulkController } from '../../packages/api/src/api/bulk/bulk.controller';
import { BulkApiService } from '../../packages/api/src/api/bulk/bulk.api-service';
import { CardController } from '../../packages/api/src/api/card/card.controller';
import { CardApiService } from '../../packages/api/src/api/card/card.api-service';
import { CardService } from '../../packages/api/src/models/card/card.service';
import { SetController } from '../../packages/api/src/api/set/set.controller';
import { SetApiService } from '../../packages/api/src/api/set/set.api-service';
import { PlayableCardController } from '../../packages/api/src/api/playable-card/playable-card.controller';
import { PlayableCardApiService } from '../../packages/api/src/api/playable-card/playable-card.api-service';
import { ClassicCatalogueController } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.controller';
import { ClassicCatalogueService } from '../../packages/api/src/models/classic-catalogue/classic-catalogue.service';

describe('Administrative API authorization', () => {
  let app: INestApplication;
  const token = 'a-dedicated-technical-administrator-token';
  let configuredToken = token;
  const operation = jest.fn().mockResolvedValue({ ok: true });
  const routes = [
    '/scryfall/import/all?local=true&onlyExpansion=true',
    '/card/scryfall/import?local=true',
    '/card/scryfall/create/4bb07091-86d6-4735-82b6-6e71e26710f4',
    '/set/scryfall/import?onlyExpansion=true',
    '/playable-cards/manual',
    '/playable-cards/automatic',
    '/admin/catalogue/prepare',
  ];
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        BulkController,
        CardController,
        SetController,
        PlayableCardController,
        ClassicCatalogueController,
      ],
      providers: [
        { provide: ConfigService, useValue: { get: () => configuredToken } },
        { provide: ClassicCatalogueService, useValue: { prepare: operation } },
        { provide: BulkApiService, useValue: { importAll: operation } },
        {
          provide: CardApiService,
          useValue: {
            importAllFromScryfall: operation,
            createFromScryfallId: operation,
          },
        },
        { provide: CardService, useValue: {} },
        {
          provide: SetApiService,
          useValue: { importScryfallSetToDatabase: operation },
        },
        {
          provide: PlayableCardApiService,
          useValue: {
            insertManualCards: operation,
            insertAutomaticCards: operation,
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    configuredToken = token;
    operation.mockClear();
  });
  it.each(routes)(
    'should reject the mutation when administrator credentials are missing: %s',
    async (route) => {
      await request(app.getHttpServer())
        .post(route)
        .send({ cardsName: [] })
        .expect(401);
      expect(operation).not.toHaveBeenCalled();
    },
  );
  it.each(routes)(
    'should allow the mutation when the administrator token is valid: %s',
    async (route) => {
      await request(app.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${token}`)
        .send({ cardsName: [] })
        .expect(201);
      expect(operation).toHaveBeenCalledTimes(1);
    },
  );
  it('should reject the request when the administrator token is incorrect', async () => {
    await request(app.getHttpServer())
      .post(routes[0])
      .set('Authorization', 'Bearer incorrect')
      .expect(401);
    expect(operation).not.toHaveBeenCalled();
  });
  it('should disable HTTP administration when no token is configured', async () => {
    configuredToken = '';
    await request(app.getHttpServer())
      .post(routes[0])
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(operation).not.toHaveBeenCalled();
  });
});
