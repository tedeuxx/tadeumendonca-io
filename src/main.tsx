import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@cloudscape-design/global-styles/index.css'; // coexistence: un-migrated pages still use Cloudscape
import './styles/index.css'; // loaded after so brand tokens/base win
import { configureAmplify } from './auth/amplify';
import { ThemeProvider } from './theme/ThemeProvider';
import { App } from './App';

configureAmplify(); // Cognito hosted-UI PKCE — must run before any auth call

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
