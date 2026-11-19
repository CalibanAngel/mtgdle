import type { ClassicGuess, ClassicState } from '@mtgdle/shared-types';
import type { ClassicDaily } from '../classic-daily/classic-daily';

export class ClassicProgress {
  day: string;
  sessionId: string;
  status: ClassicState['status'];
  guesses: ClassicGuess[];
  removed: string[];
  hintUsed: boolean;
  artUsed: boolean;
  textUsed: boolean;
  daily?: ClassicDaily;
}
