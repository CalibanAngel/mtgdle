import { Test, TestingModule } from '@nestjs/testing';
import { SetApiService } from '../../../../src/api/set/set.api-service';
import { SetService } from '../../../../src/models/set/set.service';
import { ScryfallSetService } from '../../../../src/infrastructure/external/scryfall/set/scryfall-set.service';
import { CardSet } from '../../../../src/models/set/set';
import { UpsertResult } from '../../../../src/infrastructure/database/database.interface';
import { SetType } from '../../../../src/models/set/set.enum';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('SetApiService', () => {
  let service: SetApiService;
  let setServiceMock: Partial<SetService>;
  let scryfallSetServiceMock: Partial<ScryfallSetService>;

  beforeEach(async () => {
    setServiceMock = {
      bulkInsert: jest.fn(),
    };

    scryfallSetServiceMock = {
      getAllSets: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetApiService,
        { provide: SetService, useValue: setServiceMock },
        { provide: ScryfallSetService, useValue: scryfallSetServiceMock },
      ],
    }).compile();

    service = module.get<SetApiService>(SetApiService);
  });

  describe('getAllSets', () => {
    it('should return expected UpsertResult when importing sets successfully', async () => {
      const fakeSets: CardSet[] = [
        {
          name: 'Test Set',
          id: 'test-id',
          code: 'TS',
          releasedAt: '2023-01-01',
          cardCount: 100,
          setType: SetType.Core, // cast to any or use the appropriate SetType enum value
          scryfallUri: 'http://example.com/set/test-id',
          iconSVGuri: 'http://example.com/set/test-id/icon.svg',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const expectedResult: UpsertResult<CardSet> = {
        inserted: fakeSets,
        updated: [],
      };

      (scryfallSetServiceMock.getAllSets as jest.Mock).mockReturnValue(
        of(fakeSets),
      );
      (setServiceMock.bulkInsert as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await firstValueFrom(
        service.importScryfallSetToDatabase(),
      );

      expect(scryfallSetServiceMock.getAllSets).toHaveBeenCalled();
      expect(setServiceMock.bulkInsert).toHaveBeenCalledWith(fakeSets);
      expect(result).toEqual(expectedResult);
    });

    it('should handle an error when getAllSets fails', async () => {
      const errorMessage = 'failed to fetch sets';

      (scryfallSetServiceMock.getAllSets as jest.Mock).mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      await expect(
        firstValueFrom(service.importScryfallSetToDatabase()),
      ).rejects.toThrow(errorMessage);
      expect(setServiceMock.bulkInsert).not.toHaveBeenCalled();
    });
  });
});
