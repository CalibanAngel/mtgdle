import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { GameController } from '../../packages/api/src/api/game/game.controller';
import { GameApiService } from '../../packages/api/src/api/game/game.api-service';

// Contract test without access to the developer database.
describe('Game HTTP contract', () => {
  let app: INestApplication;
  const guessCard = jest.fn().mockResolvedValue(true);
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [GameController],
      providers: [{ provide: GameApiService, useValue: { guessCard } }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => guessCard.mockClear());
  it('should reject the request when the card ID is not a UUID', async () => {
    await request(app.getHttpServer())
      .post('/game/guess-card/invalid')
      .expect(400);
    expect(guessCard).not.toHaveBeenCalled();
  });
  it('should invoke the service when the card ID is a valid UUID', async () => {
    const id = '4bb07091-86d6-4735-82b6-6e71e26710f4';
    await request(app.getHttpServer())
      .post(`/game/guess-card/${id}`)
      .expect(201)
      .expect('true');
    expect(guessCard).toHaveBeenCalledWith(id);
  });
});
