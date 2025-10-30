import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContainer from './AppContainer';
import { ToastProvider } from './contexts/ToastContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <AppContainer />
    </ToastProvider>
  </React.StrictMode>
);