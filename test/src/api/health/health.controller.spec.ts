import { HealthController } from '../../../../packages/api/src/api/health/health.controller';
import { HealthApiService } from '../../../../packages/api/src/api/health/health.api-service';

describe('HealthController', () => {
  it('preserves dependency failures', async () => {
    const service = {
      areAllServicesAlive: jest
        .fn()
        .mockRejectedValue(new Error('database unavailable')),
    };
    await expect(
      new HealthController(service as unknown as HealthApiService).check(),
    ).rejects.toThrow('database unavailable');
  });
});
