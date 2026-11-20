import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { BatchModule } from './batch.module';
import { BatchCommand, BatchService, batchCommands } from './batch.service';

async function main() {
  const [command, ...flags] = process.argv.slice(2);
  if (
    !(batchCommands as readonly string[]).includes(command) ||
    flags.some((flag) => flag !== '--check' || command !== 'classic:prepare')
  ) {
    throw new Error(
      `Usage: npm run batch -- <${batchCommands.join('|')}> [--check for classic:prepare]`,
    );
  }
  const app = await NestFactory.createApplicationContext(BatchModule);
  try {
    await app
      .get(BatchService)
      .run(command as BatchCommand, flags.includes('--check'));
  } finally {
    await app.close();
  }
}
void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Batch failed');
  process.exitCode = 1;
});
