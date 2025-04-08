// scryfall-set.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ScryfallSetService } from '../../../../../../src/infrastructure/external/scryfall/set/scryfall-set.service';
import { ScrayfallSetDao } from '../../../../../../src/infrastructure/external/scryfall/set/scrayfall-set.dao';
import { CardSet } from '../../../../../../src/models/set/set';
import { scryfallSetToSetMapper } from '../../../../../../src/infrastructure/external/scryfall/set/scryfall-set-to-set.mapper';
import { ScryfallSet } from '@scryfall/api-types';
import { SetType } from '../../../../../../src/models/set/set.enum';

// Mock the mapper to have predictable behavior
jest.mock(
  '../../../../../../src/infrastructure/external/scryfall/set/scryfall-set-to-set.mapper',
  () => ({
    scryfallSetToSetMapper: jest.fn(
      (scryfallSet: ScryfallSet): CardSet => ({
        name: scryfallSet.name,
        id: scryfallSet.id,
        code: scryfallSet.code,
        releasedAt: scryfallSet.released_at,
        cardCount: scryfallSet.card_count,
        setType: scryfallSet.set_type as SetType,
        scryfallUri: scryfallSet.scryfall_uri,
        iconSVGuri: scryfallSet.icon_svg_uri,
        createdAt: '',
        updatedAt: '',
      }),
    ),
  }),
);

describe('ScryfallSetService', () => {
  let service: ScryfallSetService;
  let scrayfallSetDaoMock: Partial<ScrayfallSetDao>;

  beforeEach(async () => {
    scrayfallSetDaoMock = {
      getAllSets: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScryfallSetService,
        { provide: ScrayfallSetDao, useValue: scrayfallSetDaoMock },
      ],
    }).compile();

    service = module.get<ScryfallSetService>(ScryfallSetService);
  });

  it('should map Scryfall sets to CardSet objects', (done) => {
    const fakeScryfallSet = {
      name: 'Test Set',
      id: 'test-id',
      code: 'ts',
      released_at: '2023-01-01',
      card_count: 57,
      set_type: SetType.Alchemy,
      scryfall_uri: 'http://test.com',
      icon_svg_uri: 'http://test.com/icon.svg',
    };

    const expected: CardSet = {
      name: fakeScryfallSet.name,
      id: fakeScryfallSet.id,
      code: fakeScryfallSet.code,
      releasedAt: fakeScryfallSet.released_at,
      cardCount: fakeScryfallSet.card_count,
      setType: fakeScryfallSet.set_type,
      scryfallUri: fakeScryfallSet.scryfall_uri,
      iconSVGuri: fakeScryfallSet.icon_svg_uri,
      createdAt: '',
      updatedAt: '',
    };

    const fakeResponse = { data: { data: [fakeScryfallSet] } };

    (scrayfallSetDaoMock.getAllSets as jest.Mock).mockReturnValue(
      of(fakeResponse),
    );

    service.getAllSets().subscribe({
      next: (result: CardSet[]) => {
        expect(result).toStrictEqual([expected]);
        expect(scryfallSetToSetMapper).toHaveBeenCalledWith(fakeScryfallSet);
        done();
      },
      error: done,
    });
  });
});
