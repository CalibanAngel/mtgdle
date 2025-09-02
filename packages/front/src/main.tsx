import React from 'react';
import ReactDOM from 'react-dom/client';

import '@/styles/globals.css';
import { App } from '@/app';

const root = document.getElementById('root');

if (!root) throw new Error('No root element found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
