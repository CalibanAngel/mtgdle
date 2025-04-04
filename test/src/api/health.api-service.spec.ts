import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckResult,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as nock from 'nock';
import { HealthApiService } from '../../../src/api/health/health.api-service';
import { HttpModule } from '@nestjs/axios';

describe('HealthApiService', () => {
  let service: HealthApiService;

  const scryfallHost = 'http://scryfall.example.com';

  const mockConfigService = {
    get: (key: string) => {
      if (key === 'scryfall.host') {
        return scryfallHost;
      }
      return null;
    },
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
  };

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule, HttpModule],
      providers: [
        HealthApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    service = module.get<HealthApiService>(HealthApiService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should return "up" for scryfall health check', async () => {
    // Intercept the HTTP call to scryfall endpoint.
    nock(scryfallHost).get('/symbology').reply(200);

    const { scryfall } = await service.isScryfallAlive();
    expect(scryfall.status).toEqual('up');
  });

  it('should return "up" for database health check', async () => {
    const { database } = await service.isDatabaseAlive();
    expect(database.status).toEqual('up');
    // Ensure the TypeOrmHealthIndicator.pingCheck was called.
    expect(mockTypeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith(
      'database',
    );
  });

  it('should return all services "up" when both checks pass', async () => {
    // Set up the scryfall endpoint to respond with success.
    nock(scryfallHost).get('/symbology').reply(200);

    const result: HealthCheckResult = await service.areAllServicesAlive();
    // The health check result contains an info property with each indicator's result.
    expect(result.info?.scryfall?.status).toEqual('up');
    expect(result.info?.database?.status).toEqual('up');
  });
});
