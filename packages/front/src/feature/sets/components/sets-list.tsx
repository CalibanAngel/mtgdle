import { useI18n, type TranslationKey } from '@/i18n';
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

const columns: { key: keyof ICardSet; label: TranslationKey }[] = [
  { key: 'name', label: 'name' },
  { key: 'code', label: 'code' },
  { key: 'setType', label: 'setType' },
  { key: 'releasedAt', label: 'releaseDate' },
  { key: 'iconSVGuri', label: 'icon' },
  { key: 'cardCount', label: 'cards' },
];

export const SetsList = () => {
  const { t } = useI18n();
  const setsQuery = useSets();

  const sets = setsQuery.data?.data;

  return (
    <Table aria-label={t('sets')}>
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>{t(column.label)}</TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent={t('noRows')}
        isLoading={setsQuery.isLoading}
        items={sets ?? []}
        loadingContent={<Spinner label={t('loading')} />}
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
