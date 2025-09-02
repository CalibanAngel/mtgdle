import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  getKeyValue,
} from '@heroui/table';
import { ICardSet } from '@mtgdle/shared-types';
import { Spinner } from '@heroui/spinner';

import { useSets } from '@/feature/sets/api/get-sets.ts';

const columns: { key: keyof ICardSet; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'setType', label: 'Type' },
  { key: 'releasedAt', label: 'Release date' },
  { key: 'iconSVGuri', label: 'Icon' },
  { key: 'cardCount', label: 'Cards' },
];

export const SetsList = () => {
  const setsQuery = useSets();

  const sets = setsQuery.data?.data;

  return (
    <Table aria-label="Sets">
      <TableHeader columns={columns}>
        {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
      </TableHeader>
      <TableBody
        emptyContent={setsQuery.isLoading ? 'No rows to display.' : ''}
        isLoading={setsQuery.isLoading}
        items={sets ?? []}
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
  );
};
