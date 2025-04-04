import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
  TerminusModule,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as nock from 'nock';
import { HealthApiService } from '../../../src/api/health/health.api-service';
import { HttpModule } from '@nestjs/axios';

describe('HealthApiService', () => {
  let service: HealthApiService;

  const mockConfigService = {
    get: (key: string) => {
      if (key === 'scryfall.host') {
        return 'http://scryfall.example.com';
      }
      return null;
    },
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
      ],
    }).compile();

    service = module.get<HealthApiService>(HealthApiService);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should return healthy status for scryfall', async () => {
    nock('http://scryfall.example.com').get('/symbology').reply(200);

    const result: HealthCheckResult = await service.isScryfallAlive();
    expect(result).toHaveProperty('details');
    expect(result.details).toHaveProperty('scryfall');
    expect(result.info?.scryfall?.status).toEqual('up');
  });

  it('should return healthy status for database', async () => {
    nock('http://localhost:8080').get('/health').reply(200);

    const result: HealthCheckResult = await service.isDatabaseAlive();
    expect(result).toHaveProperty('details');
    expect(result.details).toHaveProperty('database');
    expect(result.info?.database?.status).toEqual('up');
  });
});
