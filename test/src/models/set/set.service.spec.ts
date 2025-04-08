// set.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SetService } from '../../../../src/models/set/set.service';
import { SetRepository } from '../../../../src/models/set/set.repository';
import { CardSet } from '../../../../src/models/set/set';
import { UpsertResult } from '../../../../src/infrastructure/database/database.interface';
import { SetType } from '../../../../src/models/set/set.enum';

describe('SetService', () => {
  let service: SetService;
  let setRepositoryMock: Partial<SetRepository>;

  beforeEach(async () => {
    setRepositoryMock = {
      upsertBulk: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetService,
        { provide: SetRepository, useValue: setRepositoryMock },
      ],
    }).compile();

    service = module.get<SetService>(SetService);
  });

  describe('upsertBulk', () => {
    it('should call cardSetRepository.upsertBulk with provided sets and return the result', async () => {
      const fakeSets: CardSet[] = [
        {
          name: 'Test Set',
          id: 'test-id',
          code: 'TS',
          releasedAt: '2023-01-01',
          cardCount: 10,
          setType: 'test' as SetType, // replace with an appropriate value from SetType if available
          scryfallUri: 'http://example.com/test-id',
          iconSVGuri: 'http://example.com/test-id/icon.svg',
          createdAt: '',
          updatedAt: '',
        },
      ];
      const expectedResult: UpsertResult<CardSet> = {
        inserted: fakeSets,
        updated: [],
      };

      (setRepositoryMock.upsertBulk as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await service.bulkInsert(fakeSets);

      expect(setRepositoryMock.upsertBulk).toHaveBeenCalledWith(fakeSets);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate an error when cardSetRepository.upsertBulk rejects', async () => {
      const fakeSets: CardSet[] = [
        {
          name: 'Test Set',
          id: 'test-id',
          code: 'TS',
          releasedAt: '2023-01-01',
          cardCount: 10,
          setType: 'test' as SetType,
          scryfallUri: 'http://example.com/test-id',
          iconSVGuri: 'http://example.com/test-id/icon.svg',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const error = new Error('upsert failed');
      (setRepositoryMock.upsertBulk as jest.Mock).mockRejectedValue(error);

      await expect(service.bulkInsert(fakeSets)).rejects.toThrow(error);
    });
  });
});
