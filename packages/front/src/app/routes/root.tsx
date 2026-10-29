import { useI18n } from '@/i18n';
import { Outlet } from 'react-router';

import DefaultLayout from '@/components/layouts/default.tsx';

export const ErrorBoundary = () => {
  const { t } = useI18n();
  return <div>{t('errorGeneral')}</div>;
};

const AppRoot = () => {
  return (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  );
};

export default AppRoot;
