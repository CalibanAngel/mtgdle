export type Match = 'exact' | 'partial' | 'different' | 'higher' | 'lower';
export type Criterion =
  | 'identity'
  | 'mana'
  | 'types'
  | 'edition'
  | 'period'
  | 'keywords'
  | 'activated'
  | 'rarity';
export interface ClassicCard {
  id: string;
  name: string;
  image: string | null;
  previewImage?: string | null;
  identity: string[];
  mana: number;
  types: string[];
  edition: string;
  rarity: string;
  released: string;
  keywords: string[];
  activated: boolean;
}
export type HintKind = 'reduce' | 'art' | 'text';
export interface ClassicHint {
  kind: HintKind;
  threshold: number;
  available: boolean;
  used: boolean;
  hasImage?: boolean;
  text?: string;
}
export interface ClassicGuess {
  requestId: string;
  card: ClassicCard;
  matches: Record<Criterion, Match>;
  won: boolean;
}
export interface ClassicState {
  day: string;
  expiresAt: string;
  status: 'playing' | 'won' | 'abandoned';
  guesses: ClassicGuess[];
  choices: Pick<ClassicCard, 'id' | 'name' | 'image' | 'previewImage'>[];
  hint: { available: boolean; used: boolean; removed: number };
  hints: ClassicHint[];
  answer?: ClassicCard;
}
