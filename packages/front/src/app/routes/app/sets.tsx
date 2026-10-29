import { useI18n } from '@/i18n';
import { ContentLayout } from '@/components/layouts';
import { SetsList } from '@/feature/sets/components/sets-list';

export default function SetsRoute() {
  const { t } = useI18n();
  return (
    <ContentLayout title={t('sets')}>
      <div className="mt-4">
        <SetsList />
      </div>
    </ContentLayout>
  );
}
