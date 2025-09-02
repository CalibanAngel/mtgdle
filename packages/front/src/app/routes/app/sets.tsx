import { ContentLayout } from '@/components/layouts';
import { SetsList } from '@/feature/sets/components/sets-list';

export default function SetsRoute() {
  return (
    <ContentLayout title="Sets">
      <div className="mt-4">
        <SetsList />
      </div>
    </ContentLayout>
  );
}
