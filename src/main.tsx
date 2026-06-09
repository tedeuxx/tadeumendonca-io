import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@cloudscape-design/global-styles/index.css';
import { configureAmplify } from './auth/amplify';
import { App } from './App';

configureAmplify(); // Cognito hosted-UI PKCE — must run before any auth call

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
