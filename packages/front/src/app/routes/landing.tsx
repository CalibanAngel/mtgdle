import DefaultLayout from '@/components/layouts/default.tsx';
import { GameView } from '@/feature/game/components/game-view.tsx';

export default function LandingPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <GameView />
      </section>
    </DefaultLayout>
  );
}
