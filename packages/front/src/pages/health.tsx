import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Spacer,
  Divider,
} from '@heroui/react';

import { http } from '../config/http';

import DefaultLayout from '@/layouts/default.tsx';
import { title } from '@/components/primitives.ts';

type UpDown = 'up' | 'down';
type Overall = 'ok' | 'error';

type HealthResponse = {
  status: Overall;
  info?: Record<string, { status: UpDown }>;
  error?: Record<string, unknown>;
  details?: Record<string, { status: UpDown }>;
};

type HealthState = 'idle' | 'loading' | 'healthy' | 'unhealthy';

const StatusChip = ({
  label,
  status,
}: {
  label: string;
  status: UpDown | Overall;
}) => {
  const map = (s: UpDown | Overall) =>
    s === 'up' || s === 'ok'
      ? { color: 'success' as const, text: s === 'ok' ? 'OK' : 'Up' }
      : { color: 'danger' as const, text: s === 'error' ? 'Error' : 'Down' };

  const { color, text } = map(status);

  return (
    <Chip color={color} size="sm" variant="flat">
      {label ? `${label}: ${text}` : text}
    </Chip>
  );
};

export function Health() {
  const [state, setState] = useState<HealthState>('idle');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<HealthResponse | null>(null);

  const checkHealth = useCallback(async () => {
    setState('loading');
    setErrorMsg(null);
    setLatencyMs(null);
    const start = performance.now();

    try {
      const res = await http.get<HealthResponse>('/health');
      const end = performance.now();

      setLatencyMs(Math.round(end - start));
      setData(res.data);

      // overall state from "status"
      if (res.data.status === 'ok') {
        setState('healthy');
      } else {
        setState('unhealthy');
      }
    } catch (e: any) {
      const end = performance.now();

      setLatencyMs(Math.round(end - start));
      setData(null);
      setState('unhealthy');
      setErrorMsg(e?.response?.data?.message || e?.message || 'Request failed');
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  const services = useMemo(() => {
    const map = data?.details ?? data?.info ?? {};

    return Object.entries(map);
  }, [data]);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Health</h1>
        </div>
        <Card className="max-w-xl">
          <CardHeader className="flex justify-between items-center gap-3">
            <div className="font-semibold">API Health</div>
            <div>
              <StatusChip
                label=""
                status={data?.status ?? (state === 'healthy' ? 'ok' : 'error')}
              />
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {services.length > 0 ? (
                services.map(([name, { status }]) => (
                  <StatusChip key={name} label={name} status={status} />
                ))
              ) : (
                <Chip size="sm" variant="flat">
                  No services
                </Chip>
              )}
            </div>

            {latencyMs !== null && (
              <div className="text-default-500 text-sm">
                Latency: {latencyMs} ms
              </div>
            )}
            {errorMsg && (
              <div className="text-danger text-sm">Error: {errorMsg}</div>
            )}

            <Spacer y={1} />
            <div className="flex gap-2">
              <Button
                color="primary"
                isDisabled={state === 'loading'}
                variant="flat"
                onPress={() => checkHealth()}
              >
                {state === 'loading' ? 'Checking...' : 'Retry'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
    </DefaultLayout>
  );
}
