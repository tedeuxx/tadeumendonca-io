import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/800.css';
import './styles/index.css';
import { configureAmplify } from './auth/amplify';
import { App } from './App';

configureAmplify(); // Cognito hosted-UI PKCE — must run before any auth call

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
