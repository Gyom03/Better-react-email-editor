import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-email/editor/themes/default.css';
import 'better-react-email-editor/styles.css';
import './playground.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
