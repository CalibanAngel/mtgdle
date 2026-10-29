export type Match = 'exact' | 'partial' | 'different' | 'higher' | 'lower';
export type Criterion =
  | 'identity'
  | 'mana'
  | 'types'
  | 'edition'
  | 'period'
  | 'keywords'
  | 'activated';
export interface ClassicCard {
  id: string;
  name: string;
  image: string | null;
  identity: string[];
  mana: number;
  types: string[];
  edition: string;
  released: string;
  keywords: string[];
  activated: boolean;
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
  choices: Pick<ClassicCard, 'id' | 'name' | 'image'>[];
  hint: { available: boolean; used: boolean; removed: number };
  answer?: ClassicCard;
}
