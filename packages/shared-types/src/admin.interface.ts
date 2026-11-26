export const adminOperations = [
  'catalogue:check',
  'catalogue:prepare',
  'scryfall:download',
  'scryfall:import',
  'sets:import',
  'cards:import',
  'card:import',
  'playable:automatic',
  'playable:manual',
] as const;
export type AdminOperation = (typeof adminOperations)[number];
export interface AdminSession {
  configured: boolean;
  authenticated: boolean;
  username: string | null;
  expiresAt: string | null;
}
export interface AdminJob {
  id: string;
  operation: AdminOperation;
  status: 'running' | 'succeeded' | 'failed';
  startedAt: string;
  finishedAt: string | null;
  result: string | null;
  error: string | null;
}
export interface AdminColumn {
  name: string;
  type: string;
  primary: boolean;
  nullable: boolean;
}
export interface AdminTable {
  name: string;
  label: string;
  count: number;
  columns: AdminColumn[];
}
export interface AdminRows {
  table: string;
  total: number;
  page: number;
  pageSize: number;
  columns: AdminColumn[];
  rows: Record<string, unknown>[];
}
export interface AdminDay {
  day: string;
  sessions: number;
  players: number;
  won: number;
  abandoned: number;
  guesses: number;
  winningGuesses: number;
  reduceHints: number;
  artHints: number;
  textHints: number;
}
export interface AdminStatistics {
  since: string;
  until: string;
  days: AdminDay[];
  distribution: { guesses: number; count: number }[];
}
export interface AdminHealth {
  database: 'up' | 'down';
  scryfall: 'up' | 'down';
  checkedAt: string;
}
