import { Test } from '@nestjs/testing';
import * as nock from 'nock';
import { HealthApiService } from '../../../src/api/health/health.api-service';
import { HealthModule } from '../../../src/api/health/health.module';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpHealthIndicator } from '@nestjs/terminus';

describe('Health Api Service Integration Test', () => {
  let healthApiService: HealthApiService;

  const host = 'localhost';

  const configServiceMock = {
    get: jest.fn(),
  };
  const httpHealthIndicatorMock = {
    pingCheck: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
      providers: [
        HealthApiService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: HttpHealthIndicator,
          useValue: httpHealthIndicatorMock,
        },
      ],
    }).compile();

    healthApiService = moduleRef.get(HealthApiService);
  });

  beforeEach(() => {
    configServiceMock.get.mockResolvedValue(host);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should be alive when scryfall is alive', async () => {
    nock(host) // Making this URL identical to the one in HttpModule registration
      .get('/symbology')
      .reply(200);

    const result = await healthApiService.isScryfallAlive();
    expect(result.status).toEqual(HttpStatus.OK);
  });

  it('should call the correct url when calling isAlive', async () => {
    nock(host) // Making this URL identical to the one in HttpModule registration
      .get('/symbology')
      .reply(200);

    await healthApiService.isScryfallAlive();
    expect(httpHealthIndicatorMock.pingCheck).toHaveBeenCalledWith(
      'scryfall',
      `${host}/symbology`,
    );
  });
});
