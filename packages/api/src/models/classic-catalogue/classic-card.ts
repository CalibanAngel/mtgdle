import type { ClassicCard } from '@mtgdle/shared-types';

export interface ClassicStoredCard extends ClassicCard {
  artCrop?: string | null;
  oracleText?: string;
}
