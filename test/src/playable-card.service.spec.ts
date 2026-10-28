import { PlayableCardService } from '../../packages/api/src/models/playable-card/playable-card.service';
import { PlayableCardRepository } from '../../packages/api/src/models/playable-card/playable-card.repository';

describe('Playable catalogue', () => {
  const repository = {
    insertFromCardNames: jest.fn(),
    insertAutomaticByEdhrcRank: jest.fn(),
    getRandom: jest.fn(),
  };
  const service = new PlayableCardService(
    repository as unknown as PlayableCardRepository,
  );
  beforeEach(() => jest.resetAllMocks());
  it('does not write for an empty selection', async () => {
    expect(await service.insertManualCards([])).toEqual({
      inserted: [],
      alreadyPresent: [],
      notFound: [],
    });
    expect(repository.insertFromCardNames).not.toHaveBeenCalled();
  });
  it('preserves the detailed manual insertion result', async () => {
    const result = { inserted: ['A'], alreadyPresent: ['B'], notFound: ['C'] };
    repository.insertFromCardNames.mockResolvedValue(result);
    expect(await service.insertManualCards(['A', 'B', 'C'])).toEqual(result);
  });
  it('applies the existing popularity threshold', async () => {
    await service.insertAutomaticCards();
    expect(repository.insertAutomaticByEdhrcRank).toHaveBeenCalledWith(500);
  });
  it('propagates an empty-catalogue selection failure', async () => {
    repository.getRandom.mockRejectedValue(new Error('empty catalogue'));
    await expect(service.getRandom()).rejects.toThrow('empty catalogue');
  });
});
