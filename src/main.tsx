// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="462119883500-eel5ge8mfnjd19gkubfiqsbokfljoph0.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);