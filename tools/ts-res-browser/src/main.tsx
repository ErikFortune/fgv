import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Polyfills for broader browser support
import 'core-js/stable';
import 'whatwg-fetch';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
