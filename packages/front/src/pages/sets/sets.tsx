import { useCallback, useEffect, useState } from 'react';
import { ICardSet } from '@mtgdle/shared-types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumn,
  Spinner,
  getKeyValue,
} from '@heroui/react';

import DefaultLayout from '@/layouts/default.tsx';
import { title } from '@/components/primitives.ts';
import { getSets } from '@/pages/sets/sets.api.ts';

const columns: { key: keyof ICardSet; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'setType', label: 'Type' },
  { key: 'releasedAt', label: 'Release date' },
  { key: 'iconSVGuri', label: 'Icon' },
  { key: 'cardCount', label: 'Cards' },
];

export default function SetsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ICardSet[]>([]);

  const loadSets = useCallback(async () => {
    try {
      const sets = await getSets();

      setData(sets.data);
    } catch (e) {
      setData([]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSets();
  }, [loadSets]);

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Sets</h1>
        </div>
        <Table aria-label="Sets" className="w-full">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody
            emptyContent={isLoading ? 'No rows to display.' : ''}
            isLoading={isLoading}
            items={data ?? []}
            loadingContent={<Spinner label="Loading..." />}
          >
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>
                    {String(columnKey) === 'iconSVGuri' ? (
                      <i className={`ss ss-2x ss-${item.code.slice(-3)}`} />
                    ) : (
                      getKeyValue(item, columnKey)
                    )}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </DefaultLayout>
  );
}
