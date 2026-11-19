import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { of } from 'rxjs';
import { ScryfallBulkDataDao } from '../../packages/api/src/infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.dao';

describe('Scryfall bulk snapshots', () => {
  let directory: string;
  let file: string;
  let dao: ScryfallBulkDataDao;
  const metadata = jest.fn();
  const download = jest.fn();
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'mtgdle-snapshot-'));
    file = join(directory, 'cards.json');
    dao = new ScryfallBulkDataDao(
      {
        getOrThrow: (key: string) =>
          key === 'scryfall.bulkFile' ? file : 'https://api.scryfall.com',
      } as never,
      { get: metadata, axiosRef: { get: download } } as never,
    );
    jest.clearAllMocks();
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });
  it('keeps JSON array snapshots readable by the existing importer', async () => {
    metadata.mockReturnValue(
      of({ data: { download_uri: 'https://data.scryfall.io/cards.json' } }),
    );
    download.mockResolvedValue({ data: Readable.from(['[{"id":"one"}]']) });
    await dao.downloadDefaultCards();
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([{ id: 'one' }]);
  });
  it('converts compressed JSONL into a JSON array without losing Unicode', async () => {
    metadata.mockReturnValue(
      of({
        data: { jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl.gz' },
      }),
    );
    const bytes = gzipSync('{"name":"Éclair"}\n\n{"name":"火"}\n');
    download.mockResolvedValue({
      data: Readable.from([bytes.subarray(0, 7), bytes.subarray(7)]),
    });
    await dao.downloadDefaultCards();
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([
      { name: 'Éclair' },
      { name: '火' },
    ]);
  });
  it('preserves an existing snapshot and removes temporary data after invalid JSONL', async () => {
    await writeFile(file, '[{"name":"original"}]');
    metadata.mockReturnValue(
      of({
        data: { jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl.gz' },
      }),
    );
    download.mockResolvedValue({
      data: Readable.from([gzipSync('{broken json}\n')]),
    });
    await expect(dao.downloadDefaultCards()).rejects.toThrow();
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([
      { name: 'original' },
    ]);
    expect(await readdir(directory)).toEqual(['cards.json']);
  });
  it('rejects an unexpected download host before making a request', async () => {
    metadata.mockReturnValue(
      of({ data: { download_uri: 'https://example.com/cards.json' } }),
    );
    await expect(dao.streamDefaultCards()).rejects.toThrow('host');
    expect(download).not.toHaveBeenCalled();
  });
});
