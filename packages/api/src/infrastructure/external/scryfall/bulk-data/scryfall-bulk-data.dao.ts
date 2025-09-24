import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../../../../config/config';
import { HttpService } from '@nestjs/axios';
import { ScryfallBulkData } from './scryfall-bulk-data';
import { firstValueFrom, map } from 'rxjs';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { Readable } from 'node:stream';
import { ScryfallCard } from '@scryfall/api-types';
import { join, resolve } from 'node:path';
import { createReadStream } from 'node:fs';
import { IImportStats } from '@mtgdle/shared-types';

@Injectable()
export class ScryfallBulkDataDao {
  private readonly logger = new Logger(ScryfallBulkDataDao.name);
  private host: string;

  constructor(
    private configService: ConfigService<Configuration>,
    private httpService: HttpService,
  ) {
    this.host = this.configService.getOrThrow('scryfall.host', { infer: true });
  }

  getDefaultCardFileInfo() {
    return this.httpService.get<ScryfallBulkData>(
      `${this.host}/bulk-data/default-cards`,
    );
  }

  readLocalFile(file: string): Readable {
    const abs = resolve(file);
    this.logger.debug(`Start reading local file at ${abs}`);
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

    this.logger.log(
      `Scryfall file at uri ${bulkInfo.download_uri} while be stream`,
    );

    const response = await this.httpService.axiosRef.get<Readable>(
      bulkInfo.download_uri,
      {
        responseType: 'stream',
      },
    );

    // response.data is a Node.js Readable stream of the JSON file
    return response.data;
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
      this.logger.debug(`Processed batch #${batchCount} with ${cards.length} items in ${batchDurationMs} ms`);
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
      finishedAt
    };
  }

  /**
   * Convenience wrapper to parse the bundled mock data incrementally.
   */
  getLocalStream(): Readable {
    const filePath = join(
      process.cwd(),
      'src',
      'infrastructure',
      'external',
      'scryfall',
      'bulk-data',
      'default-cards.json',
    );
    return this.readLocalFile(filePath);
  }
}
