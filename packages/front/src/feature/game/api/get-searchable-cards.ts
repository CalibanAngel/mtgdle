import { IPlayableCard } from '@mtgdle/shared-types';
import { useQuery } from '@tanstack/react-query';

import { http } from '@/config/http.ts';

export const getPlayableCards = () => http<IPlayableCard[]>('/playable-cards');

export const usePlayableCards = () => {
  return useQuery({
    queryKey: ['playableCards'],
    queryFn: () => getPlayableCards(),
  });
};
