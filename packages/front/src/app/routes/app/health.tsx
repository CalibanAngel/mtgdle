import { useI18n } from '@/i18n';
import { ContentLayout } from '@/components/layouts';
import HealthView from '@/feature/health/components/health-view.tsx';

export default function HealthRoute() {
  const { t } = useI18n();
  return (
    <ContentLayout title={t('health')}>
      <div className="mt-4">
        <HealthView />
      </div>
    </ContentLayout>
  );
}
