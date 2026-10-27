import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// HashRouter (no BrowserRouter): GitHub Pages es hosting puramente estático y no
// puede reescribir cualquier ruta a index.html, así que un refresco en, por
// ejemplo, /briefing/n1_paracetamol daría 404. Con HashRouter las rutas van después
// de "#" (p. ej. /#/briefing/n1_paracetamol), que el navegador nunca manda al
// servidor, así que siempre carga index.html. Sin esto, cualquier otro hosting
// (Vercel, Netlify, nginx con fallback) también funcionaría con BrowserRouter, pero
// HashRouter funciona en todos por igual y evita mantener dos configuraciones.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
