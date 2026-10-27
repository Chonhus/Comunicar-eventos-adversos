import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  // En local/producción normal se sirve en la raíz ("/"). El workflow de GitHub
  // Pages (.github/workflows/deploy-pages.yml) pone GITHUB_PAGES_BASE a la subruta
  // del repo, porque Pages sirve el sitio en github.io/<repo>/, no en la raíz del
  // dominio. Los assets de config/casos.json (avatars/fondos) usan
  // src/lib/rutaPublica.ts para respetar esta misma base en tiempo de ejecución.
  base: process.env.GITHUB_PAGES_BASE ?? '/',
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
