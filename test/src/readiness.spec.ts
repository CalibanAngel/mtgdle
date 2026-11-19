import { ServiceUnavailableException } from '@nestjs/common';
import { ReadinessService } from '../../packages/api/src/api/health/readiness.service';

describe('Game readiness', () => {
  const db = { query: jest.fn() };
  const readiness = new ReadinessService(db as never);
  beforeEach(() => jest.resetAllMocks());
  it('requires a database with a prepared catalogue', async () => {
    db.query.mockResolvedValue([{ ready: true }]);
    await expect(readiness.check()).resolves.toEqual({ status: 'ok' });
  });
  it('reports an empty catalogue as unavailable', async () => {
    db.query.mockResolvedValue([{ ready: false }]);
    await expect(readiness.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
  it('does not expose a database error to callers', async () => {
    db.query.mockRejectedValue(new Error('connection credentials'));
    await expect(readiness.check()).rejects.toThrow('Game is not ready');
  });
});
