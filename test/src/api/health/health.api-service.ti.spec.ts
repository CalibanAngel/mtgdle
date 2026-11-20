import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckResult,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import nock from 'nock';
import { HttpModule } from '@nestjs/axios';
import { HealthApiService } from '../../../../packages/api/src/api/health/health.api-service';
import { scryfallHost } from '../constant';

describe('HealthApiService', () => {
  let service: HealthApiService;

  const mockConfigService = {
    getOrThrow: (key: string) => {
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

  it('should report Scryfall as up when the remote health endpoint responds', async () => {
    // Intercept the HTTP call to scryfall endpoint.
    nock(scryfallHost).get('/symbology').reply(200);

    const { scryfall } = await service.isScryfallAlive();
    expect(scryfall.status).toEqual('up');
  });

  it('should report PostgreSQL as up when the database ping succeeds', async () => {
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

  it('should check only PostgreSQL when Docker requests database health', async () => {
    const scryfall = jest.spyOn(service, 'isScryfallAlive');
    const result = await service.checkDatabase();
    expect(result.status).toBe('ok');
    expect(result.info?.database?.status).toBe('up');
    expect(scryfall).not.toHaveBeenCalled();
    scryfall.mockRestore();
  });

  it('should propagate database failures when checking database-only health', async () => {
    mockTypeOrmHealthIndicator.pingCheck.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(service.checkDatabase()).rejects.toThrow();
  });
});
