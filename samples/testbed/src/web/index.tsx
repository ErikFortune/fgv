/**
 * Web entry point. Orchestration glue only — the testable shell lives in `./App.tsx`.
 * Coverage-ignored per `samples/testbed/src/conventions.md`.
 */

/* c8 ignore start - entry-point orchestration glue per testbed conventions */
import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

const container: HTMLElement | null = document.getElementById('root');
if (!container) {
  throw new Error('testbed: #root element not found in index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
/* c8 ignore stop */
