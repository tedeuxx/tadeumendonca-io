import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/index.css';
import { App } from './App';
import { unregisterServiceWorkers } from './lib/serviceWorker';
import { detectLocale, htmlLang } from './i18n';

void unregisterServiceWorkers();

// Seed <html lang> SYNCHRONOUSLY, before createRoot, so the served/prerendered HTML is already correct
// (no post-mount flash). Per-locale URLs (ADR-0036): the path is authoritative — `/pt/…` seeds pt, `/en/…`
// en; a bare/unprefixed URL falls through to persisted → navigator → en (the x-default baseline) until the
// client-side redirect prefixes it. The LocaleProvider (inside the /:locale route) owns it thereafter.
document.documentElement.lang = htmlLang(detectLocale(window.location.pathname));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
