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
  it('should skip insertion when the selected card list is empty', async () => {
    expect(await service.insertManualCards([])).toEqual({
      inserted: [],
      alreadyPresent: [],
      notFound: [],
    });
    expect(repository.insertFromCardNames).not.toHaveBeenCalled();
  });
  it('should return the detailed insertion result when named cards are inserted', async () => {
    const result = { inserted: ['A'], alreadyPresent: ['B'], notFound: ['C'] };
    repository.insertFromCardNames.mockResolvedValue(result);
    expect(await service.insertManualCards(['A', 'B', 'C'])).toEqual(result);
  });
  it('should apply the popularity threshold when selecting cards automatically', async () => {
    await service.insertAutomaticCards();
    expect(repository.insertAutomaticByEdhrcRank).toHaveBeenCalledWith(500);
  });
  it('should propagate selection failure when the catalogue is empty', async () => {
    repository.getRandom.mockRejectedValue(new Error('empty catalogue'));
    await expect(service.getRandom()).rejects.toThrow('empty catalogue');
  });
});
