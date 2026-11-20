import { GameController } from '../../packages/api/src/api/game/game.controller';
import { GameApiService } from '../../packages/api/src/api/game/game.api-service';

describe('GameController', () => {
  it('should propagate creation failures when creating a daily game', async () => {
    const service = {
      createTodayGame: jest.fn().mockRejectedValue(new Error('duplicate day')),
    };
    const controller = new GameController(service as unknown as GameApiService);
    await expect(controller.newTodayGame()).rejects.toThrow('duplicate day');
  });
});
