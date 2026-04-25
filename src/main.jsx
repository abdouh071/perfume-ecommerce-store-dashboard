import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import './index.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Suppress Firestore SDK v12 internal assertion errors that fire during
// onSnapshot listener cleanup on navigation. These are harmless SDK-internal
// race conditions in the WatchChangeAggregator, not real app errors.
window.addEventListener('error', (event) => {
  if (event.error?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.warn('[Global] Suppressed Firestore SDK internal assertion.');
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
});
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.warn('[Global] Suppressed Firestore SDK internal assertion (promise).');
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
