import type { ClassicStoredCard } from '../classic-catalogue/classic-card';

export class ClassicDaily {
  day: string;
  answerId: string;
  cards: ClassicStoredCard[];
  rulesVersion: number;
}
