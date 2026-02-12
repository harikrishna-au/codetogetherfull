import React from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

// Polyfill for requestIdleCallback
if (!window.requestIdleCallback) {
  (window as any).requestIdleCallback = function (cb: any) {
    const start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
}

if (!window.cancelIdleCallback) {
  (window as any).cancelIdleCallback = function (id: any) {
    clearTimeout(id);
  };
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
