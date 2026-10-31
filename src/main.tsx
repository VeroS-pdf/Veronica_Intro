/**
 * Entry point: loads fonts and styles, then mounts <App /> into index.html.
 */
import '@fontsource/jersey-10/400.css';
import '@fontsource/vt323/400.css';

import './styles/theme.css';
import './styles/desktop.css';
import './styles/browser.css';
import './styles/pages.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
