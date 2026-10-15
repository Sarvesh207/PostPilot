import '@fontsource-variable/geist';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ComponentsPage } from './dev/ComponentsPage';

// Hidden dev route for the component sheet; no router needed yet.
const isComponentSheet = window.location.pathname.replace(/\/$/, '') === '/components';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isComponentSheet ? <ComponentsPage /> : <App />}</StrictMode>,
);
