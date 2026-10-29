import { useI18n } from '@/i18n';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { UpDown } from '@mtgdle/shared-types/dist/health';

import { HealthResponse, useHealth } from '../api/get-health';

import { StatusChip } from './status-chip';

const getPartStatus = (
  data: HealthResponse | undefined,
  key: string,
): UpDown | undefined => {
  const source = data?.details ?? data?.info ?? {};
  const raw = source[key]?.status;

  if (raw === 'up' || raw === 'down') return raw;

  return undefined;
};

export const HealthView = () => {
  const { t } = useI18n();
  const { data, isFetching, refetch, isError, error } = useHealth();

  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const measureStartRef = useRef<number | null>(null);

  const onRefresh = useCallback(async () => {
    measureStartRef.current = performance.now();
    try {
      setLatencyMs(null);
      await refetch();
    } finally {
      if (measureStartRef.current != null) {
        setLatencyMs(
          Math.max(0, Math.round(performance.now() - measureStartRef.current)),
        );
        measureStartRef.current = null;
      }
    }
  }, [refetch]);

  const overall = data?.status === 200 ? 'up' : 'down';
  const dbStatus = getPartStatus(data?.data, 'database') ?? 'down';
  const scryfallStatus = getPartStatus(data?.data, 'scryfall') ?? 'down';

  return (
    <Card className="max-w-2xl">
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('healthApi')}</h2>
        <Button
          aria-label={t('refresh')}
          color="primary"
          isDisabled={isFetching}
          isLoading={isFetching}
          size="sm"
          onPress={onRefresh}
        >
          {t('refresh')}
        </Button>
      </CardHeader>

      <CardBody className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip
            isLoading={isFetching}
            label={t('overall')}
            status={overall}
          />
          <StatusChip
            isLoading={isFetching}
            label={t('database')}
            status={dbStatus}
          />
          <StatusChip
            isLoading={isFetching}
            label="Scryfall API"
            status={scryfallStatus}
          />
        </div>

        <div className="text-sm text-default-600">
          {t('latency')}: {latencyMs != null ? `${latencyMs} ms` : '—'}
        </div>
      </CardBody>

      {isError && (
        <CardFooter>
          <pre className="w-full rounded-medium bg-default-100 p-3 text-xs text-danger-600 overflow-auto">
            {error?.message ?? t('errorNetwork')}
          </pre>
        </CardFooter>
      )}
    </Card>
  );
};

export default HealthView;
