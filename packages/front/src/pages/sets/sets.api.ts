import { ICardSet } from '@mtgdle/shared-types';

import { http } from '@/config/http.ts';

export const getSets = () => http<ICardSet[]>('/set');
