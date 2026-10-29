import { useI18n } from '@/i18n';
import { Link } from '@heroui/link';

import { paths } from '@/config/paths';

const NotFoundRoute = () => {
  const { t } = useI18n();
  return (
    <div className="mt-52 flex flex-col items-center font-semibold">
      <h1>{t('notFound')}</h1>
      <p>{t('notFoundBody')}</p>
      <Link href={paths.home.getHref()}>{t('home')}</Link>
    </div>
  );
};

export default NotFoundRoute;
