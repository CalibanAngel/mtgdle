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
import { SetType } from '@mtgdle/shared-types';

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

    this.logger.debug(
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

  /**
   * Example: Incrementally parse the Scryfall JSON array and handle items one-by-one.
   * Requires installing a streaming JSON parser:
   *   npm install stream-json
   *
   * onItem will be called for each card object.
   */
  async processDefaultCardsIncrementally(
    stream: Readable,
    onItem: (card: ScryfallCard.Any) => Promise<void> | void,
  ): Promise<void> {
    this.logger.debug(`Start streaming file`);
    return new Promise<void>((resolve, reject) => {
      stream
        .pipe(parser())
        .pipe(streamArray())
        .on('data', async ({ value }: { value: ScryfallCard.Any }) => {
          try {
            if (
              value.layout === 'normal' &&
              [SetType.Core, SetType.Commander, SetType.Expansion, SetType.Masters].includes(value.set_type as SetType)
            ) {
              await onItem(value);
            }
          } catch (err) {
            this.logger.error(
              `An error occured when processing data for card ${value.id} for set ${value.set} with setId ${value.set_id}: `,
              err,
            );
            reject(err);
          }
        })
        .on('end', () => {
          this.logger.debug(`Finished streaming file`);
          resolve();
        })
        .on('error', (err: unknown) => {
          this.logger.error(`An error occured when processing stream: `, err);
          reject(err);
        });
    });
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
