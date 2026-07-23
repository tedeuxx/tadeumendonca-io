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
import { detectLocale, htmlLang, LocaleProvider } from './i18n';

void unregisterServiceWorkers();

// Resolve the locale SYNCHRONOUSLY, before createRoot, so React's first render is already in the
// right locale (no post-mount flash) and the served/prerendered <html lang> is correct.
const locale = detectLocale();
document.documentElement.lang = htmlLang(locale);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider initialLocale={locale}>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
