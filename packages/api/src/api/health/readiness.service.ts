import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ReadinessService {
  constructor(private readonly db: DataSource) {}

  async check(): Promise<{ status: 'ok' }> {
    try {
      const [result]: { ready: boolean }[] = await this.db.query(
        'SELECT EXISTS(SELECT 1 FROM classic_catalogue) AS ready',
      );
      if (!result.ready) throw new Error('Catalogue unavailable');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Game is not ready');
    }
  }
}
