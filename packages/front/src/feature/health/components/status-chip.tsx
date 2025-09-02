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
  const map = (s: UpDown | Overall) =>
    s === 'up' || s === 'ok'
      ? { color: 'success' as const, text: s === 'ok' ? 'OK' : 'Up' }
      : { color: 'danger' as const, text: s === 'error' ? 'Error' : 'Down' };

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
