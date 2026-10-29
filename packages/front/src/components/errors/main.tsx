import { useI18n } from '@/i18n';
import { Button } from '@heroui/button';

export const MainErrorFallback = () => {
  const { t } = useI18n();
  return (
    <div
      className="flex h-screen w-screen flex-col items-center justify-center text-red-500"
      role="alert"
    >
      <h2 className="text-lg font-semibold">{t('errorGeneral')}</h2>
      <Button
        className="mt-4"
        onPress={() => window.location.assign(window.location.origin)}
      >
        {t('refresh')}
      </Button>
    </div>
  );
};
