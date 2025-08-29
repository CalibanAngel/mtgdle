import { Route, Routes } from 'react-router-dom';

import IndexPage from '@/pages/index';
import { HealthPage } from '@/pages/health/health.tsx';
import SetsPage from '@/pages/sets/sets.tsx';

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<HealthPage />} path="/health" />
      <Route element={<SetsPage />} path="/sets" />
    </Routes>
  );
}

export default App;
