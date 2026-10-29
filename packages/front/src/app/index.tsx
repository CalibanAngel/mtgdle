import { LocaleProvider } from '@/i18n';
import { AppProvider } from './provider';
import { AppRouter } from './router';

export const App = () => {
  return (
    <LocaleProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </LocaleProvider>
  );
};
