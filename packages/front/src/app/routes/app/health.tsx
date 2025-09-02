import { ContentLayout } from '@/components/layouts';
import HealthView from '@/feature/health/components/health-view.tsx';

export default function HealthRoute() {
  return (
    <ContentLayout title="Health">
      <div className="mt-4">
        <HealthView />
      </div>
    </ContentLayout>
  );
}
