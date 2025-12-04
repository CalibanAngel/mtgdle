import { useMutation } from '@tanstack/react-query';

import { http } from '@/config/http.ts';

export const postGuessCard = (id: string) =>
  http<unknown>(`/game/guess-card/${id}`, { method: 'post' });

export const useGuessCard = () => {
  return useMutation({
    mutationKey: ['guessCard'],
    mutationFn: (id: string) => postGuessCard(id),
  });
};
