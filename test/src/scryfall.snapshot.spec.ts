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
  it('should preserve the JSON array format when downloading a legacy snapshot', async () => {
    metadata.mockReturnValue(
      of({ data: { download_uri: 'https://data.scryfall.io/cards.json' } }),
    );
    download.mockResolvedValue({ data: Readable.from(['[{"id":"one"}]']) });
    await dao.downloadDefaultCards();
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual([{ id: 'one' }]);
  });
  it('should preserve Unicode when converting compressed JSONL to a JSON array', async () => {
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
  it('should preserve the previous snapshot and remove temporary data when JSONL is invalid', async () => {
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
  it('should reject the download before sending a request when its host is unexpected', async () => {
    metadata.mockReturnValue(
      of({ data: { download_uri: 'https://example.com/cards.json' } }),
    );
    await expect(dao.streamDefaultCards()).rejects.toThrow('host');
    expect(download).not.toHaveBeenCalled();
  });
});
