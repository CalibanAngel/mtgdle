import { useI18n } from '@/i18n';
import { Overall, UpDown } from '@mtgdle/shared-types/dist/health';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';

export const StatusChip = ({
  label,
  status,
  isLoading,
}: {
  label: string;
  status: UpDown | Overall;
  isLoading?: boolean;
}) => {
  const { t } = useI18n();
  const map = (s: UpDown | Overall) =>
    s === 'up' || s === 'ok'
      ? { color: 'success' as const, text: s === 'ok' ? 'OK' : t('up') }
      : {
          color: 'danger' as const,
          text: s === 'error' ? t('statusError') : t('down'),
        };

  const { color, text } = map(status);

  return (
    <Chip
      color={color}
      endContent={isLoading ?? <Spinner size="sm" />}
      size="sm"
      variant="flat"
    >
      {label ? `${label}: ${text}` : text}
    </Chip>
  );
};
