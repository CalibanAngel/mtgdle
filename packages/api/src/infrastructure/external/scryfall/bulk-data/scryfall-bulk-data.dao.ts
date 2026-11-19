import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../../config/config';
import { HttpService } from '@nestjs/axios';
import { ScryfallBulkData } from './scryfall-bulk-data';
import { firstValueFrom, map } from 'rxjs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { ScryfallCard } from '@scryfall/api-types';
import { dirname, resolve } from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { IImportStats } from '@mtgdle/shared-types';
import { WithLogger } from '../../../logging/with-logger.abstract';

@Injectable()
export class ScryfallBulkDataDao extends WithLogger {
  private readonly host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    super();
    this.host = this.configService.getOrThrow('scryfall.host', { infer: true });
  }

  getDefaultCardFileInfo() {
    return this.httpService.get<ScryfallBulkData>(
      `${this.host}/bulk-data/default-cards`,
    );
  }

  readLocalFile(file: string): Readable {
    const abs = resolve(file);
    this.logger.log(`Start reading local file at ${abs}`);
    const stream = createReadStream(abs, { encoding: 'utf8' });
    return stream;
  }

  /**
   * Streams the default cards JSON directly from Scryfall without saving to disk.
   * Returns the raw HTTP readable stream (JSON text).
   *
   * You can pipe this stream or consume it with a streaming JSON parser.
   */
  async streamDefaultCards(): Promise<Readable> {
    const bulkInfo = await firstValueFrom(
      this.getDefaultCardFileInfo().pipe(map((res) => res.data)),
    );

    const jsonl = !bulkInfo.download_uri && !!bulkInfo.jsonl_download_uri;
    const downloadUri = bulkInfo.download_uri || bulkInfo.jsonl_download_uri;
    if (!downloadUri)
      throw new Error('Scryfall did not return a bulk download URL.');
    const url = new URL(downloadUri);
    if (url.protocol !== 'https:' || url.hostname !== 'data.scryfall.io') {
      throw new Error('Unexpected Scryfall bulk download host.');
    }
    const response = await this.httpService.axiosRef.get<Readable>(url.href, {
      responseType: 'stream',
      timeout: 1800000,
      maxRedirects: 0,
      headers: {
        'User-Agent': 'MTGdle/1.0 (catalogue import)',
        Accept: 'application/json',
      },
    });
    if (!jsonl) return response.data;
    return this.jsonLinesToArray(response.data, url.pathname.endsWith('.gz'));
  }

  private jsonLinesToArray(source: Readable, gzip: boolean): Readable {
    return Readable.from(
      (async function* () {
        const decoded = gzip ? source.pipe(createGunzip()) : source;
        source.on('error', (error) => decoded.destroy(error));
        const lines = createInterface({ input: decoded, crlfDelay: Infinity });
        try {
          yield '[';
          let first = true;
          for await (const line of lines) {
            if (!line.trim()) continue;
            JSON.parse(line);
            yield (first ? '' : ',') + line;
            first = false;
          }
          yield ']';
        } finally {
          lines.close();
          decoded.destroy();
          source.destroy();
        }
      })(),
    );
  }

  async downloadDefaultCards(): Promise<string> {
    const file = this.configService.getOrThrow('scryfall.bulkFile', {
      infer: true,
    });
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await pipeline(
        await this.streamDefaultCards(),
        createWriteStream(temporary, { mode: 0o644 }),
      );
      await rename(temporary, file);
      this.logger.log(`Scryfall snapshot saved to ${file}`);
      return file;
    } catch (error) {
      await rm(temporary, { force: true });
      throw error;
    }
  }

  async processInBatches(
    stream: Readable,
    batchSize: number,
    onBatch: (card: ScryfallCard.Any[]) => Promise<void> | null,
  ): Promise<IImportStats> {
    this.logger.log(`Start streaming file`);
    const jsonStream = stream.pipe(parser()).pipe(streamArray());
    let batch: ScryfallCard.Any[] = [];

    const totalStartMs = Date.now();
    const startedAt = new Date(totalStartMs).toISOString();

    let totalItems = 0;
    let batchCount = 0;
    let durationMs = 0;

    const handleBatch = async (cards: ScryfallCard.Any[]) => {
      const batchStartMs = Date.now();
      await onBatch(cards);
      const batchDurationMs = Date.now() - batchStartMs;
      totalItems += cards.length;
      batchCount += 1;
      this.logger.debug(
        `Processed batch #${batchCount} with ${cards.length} items in ${batchDurationMs} ms`,
      );
    };

    try {
      for await (const { value } of jsonStream) {
        batch.push(value);
        if (batch.length >= batchSize) {
          await handleBatch(batch);
          batch = [];
        }
      }
      if (batch.length) {
        await handleBatch(batch);
      }
    } catch (streamError) {
      this.logger.error(`Error while reading/processing stream`, streamError);
      throw streamError;
    } finally {
      durationMs = Date.now() - totalStartMs;
      this.logger.log(
        `Finished streaming file: ${totalItems} items across ${batchCount} batches in ${durationMs} ms`,
      );
      stream.destroy();
    }
    const finishedAt = new Date().toISOString();

    return {
      totalItems,
      batchCount,
      durationMs,
      startedAt,
      finishedAt,
    };
  }

  /**
   * Convenience wrapper to parse the bundled mock data incrementally.
   */
  getLocalStream(): Readable {
    const filePath = this.configService.getOrThrow('scryfall.bulkFile', {
      infer: true,
    });
    return this.readLocalFile(filePath);
  }
}
