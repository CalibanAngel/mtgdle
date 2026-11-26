import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { lastValueFrom } from 'rxjs';
import type {
  AdminHealth,
  AdminJob,
  AdminOperation,
  AdminStatistics,
} from '@mtgdle/shared-types';
import { AdminRepository } from '../../models/classic-progress/admin.repository';
import { ClassicCatalogueService } from '../../models/classic-catalogue/classic-catalogue.service';
import { ScryfallBulkDataService } from '../../infrastructure/external/scryfall/bulk-data/scryfall-bulk-data.service';
import { BulkApiService } from '../bulk/bulk.api-service';
import { CardApiService } from '../card/card.api-service';
import { SetApiService } from '../set/set.api-service';
import { PlayableCardApiService } from '../playable-card/playable-card.api-service';
import { HealthApiService } from '../health/health.api-service';
import { parisDay } from '../game/classic.rules';
import { AdminJobRequestDto, AdminRowsQueryDto } from './admin.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly history: AdminJob[] = [];
  constructor(
    private readonly repository: AdminRepository,
    private readonly catalogue: ClassicCatalogueService,
    private readonly bulk: ScryfallBulkDataService,
    private readonly importer: BulkApiService,
    private readonly cards: CardApiService,
    private readonly sets: SetApiService,
    private readonly playable: PlayableCardApiService,
    private readonly healthService: HealthApiService,
  ) {}
  tables() {
    return this.repository.tables();
  }
  rows(table: string, query: AdminRowsQueryDto) {
    return this.repository.rows(table, query);
  }
  row(table: string, key: string) {
    return this.repository.row(table, key);
  }
  async statistics(days: number): Promise<AdminStatistics> {
    const until = parisDay();
    const date = new Date(`${until}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - days + 1);
    const since = date.toISOString().slice(0, 10);
    return {
      since,
      until,
      ...(await this.repository.statistics(since, until)),
    };
  }
  async health(): Promise<AdminHealth> {
    const results = await Promise.allSettled([
      this.healthService.isDatabaseAlive(),
      this.healthService.isScryfallAlive(),
    ]);
    return {
      database:
        results[0].status === 'fulfilled' &&
        results[0].value.database?.status === 'up'
          ? 'up'
          : 'down',
      scryfall:
        results[1].status === 'fulfilled' &&
        results[1].value.scryfall?.status === 'up'
          ? 'up'
          : 'down',
      checkedAt: new Date().toISOString(),
    };
  }
  jobs(): AdminJob[] {
    return this.history.map((job) => ({ ...job }));
  }
  start(input: AdminJobRequestDto): AdminJob {
    if (this.history.some((job) => job.status === 'running'))
      throw new ConflictException('Un traitement est déjà en cours.');
    if (input.operation === 'card:import' && !input.cardId)
      throw new BadRequestException('Un identifiant Scryfall est requis.');
    if (
      input.operation === 'playable:manual' &&
      !input.names?.some((name) => name.trim())
    )
      throw new BadRequestException('Indique au moins un nom de carte.');
    const job: AdminJob = {
      id: randomUUID(),
      operation: input.operation,
      status: 'running',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      result: null,
      error: null,
    };
    this.history.unshift(job);
    if (this.history.length > 20) this.history.pop();
    setImmediate(() => {
      void this.run(job, input);
    });
    return { ...job };
  }
  private summary(value: unknown, depth = 0): string {
    if (Array.isArray(value)) return `${value.length} élément(s)`;
    if (value && typeof value === 'object')
      return depth > 2
        ? 'objet'
        : Object.entries(value)
            .slice(0, 12)
            .map(([key, item]) => `${key}: ${this.summary(item, depth + 1)}`)
            .join(' · ');
    return String(value ?? 'Terminé').slice(0, 300);
  }
  private async run(job: AdminJob, input: AdminJobRequestDto): Promise<void> {
    try {
      job.result = this.summary(
        await this.execute(input.operation, input),
      ).slice(0, 2000);
      job.status = 'succeeded';
    } catch (error) {
      job.status = 'failed';
      job.error =
        'Le traitement a échoué. Consulte les journaux de l’API pour le détail.';
      this.logger.error(
        `Administrative job ${job.id} (${job.operation}) failed`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      job.finishedAt = new Date().toISOString();
    }
  }
  private execute(
    operation: AdminOperation,
    input: AdminJobRequestDto,
  ): Promise<unknown> {
    switch (operation) {
      case 'catalogue:check':
        return this.catalogue.prepare(true);
      case 'catalogue:prepare':
        return this.catalogue.prepare(false);
      case 'scryfall:download':
        return this.bulk.downloadDefaultCards();
      case 'scryfall:import':
        return this.importer.importAll(true, true);
      case 'sets:import':
        return lastValueFrom(this.sets.importScryfallSetToDatabase(true));
      case 'cards:import':
        return this.cards.importAllFromScryfall(true);
      case 'card:import':
        return this.cards.createFromScryfallId(input.cardId!);
      case 'playable:automatic':
        return this.playable.insertAutomaticCards();
      case 'playable:manual':
        return this.playable.insertManualCards(
          input.names!.map((name) => name.trim()).filter(Boolean),
        );
    }
  }
}
