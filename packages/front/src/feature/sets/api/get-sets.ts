import { ICardSet } from '@mtgdle/shared-types';
import { useQuery } from '@tanstack/react-query';

import { http } from '@/config/http.ts';

export const getSets = () => {
  return http.get<ICardSet[]>('/set');
};

export const useSets = () => {
  return useQuery({
    queryKey: ['sets'],
    queryFn: () => getSets(),
  });
};
