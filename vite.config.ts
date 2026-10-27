import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // scripts/avatares/ contiene herramientas Python/HTML de generación de avatares (ver docs/AVATARES.md),
  // no forman parte de la app: se excluyen del escaneo de dependencias de Vite.
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    // El STT/micrófono requiere contexto seguro; en local Vite ya sirve en https si se configura certificado.
    host: true,
  },
});
