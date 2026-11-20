import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ScryfallBulkDataDao } from '../../packages/api/src/infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.dao';
import { Configuration } from '../../packages/api/src/config/config';

describe('Bulk processing', () => {
  const dao = new ScryfallBulkDataDao(
    {
      getOrThrow: () => 'https://example.invalid',
    } as unknown as ConfigService<Configuration>,
    {} as HttpService,
  );
  it('should process every item when the final batch is incomplete', async () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const consume = jest.fn().mockResolvedValue(undefined);
    const result = await dao.processInBatches(
      Readable.from([JSON.stringify(items)]),
      2,
      consume,
    );
    expect(consume.mock.calls.map(([batch]) => batch)).toEqual([
      items.slice(0, 2),
      items.slice(2),
    ]);
    expect(result).toMatchObject({ totalItems: 3, batchCount: 2 });
  });
  it('should skip storage when the input file is empty', async () => {
    const consume = jest.fn();
    expect(
      await dao.processInBatches(Readable.from(['[]']), 2, consume),
    ).toMatchObject({ totalItems: 0, batchCount: 0 });
    expect(consume).not.toHaveBeenCalled();
  });
  it('should stop processing and destroy the input stream when storage fails', async () => {
    const stream = Readable.from(['[{"id":"a"},{"id":"b"}]']);
    const consume = jest.fn().mockRejectedValue(new Error('storage failure'));
    await expect(dao.processInBatches(stream, 1, consume)).rejects.toThrow(
      'storage failure',
    );
    expect(consume).toHaveBeenCalledTimes(1);
    expect(stream.destroyed).toBe(true);
  });
});
