// Los avatares/fondos vienen de config/casos.json como rutas absolutas
// ("/avatars/antonio.glb"). Eso funciona en local (servido en la raíz), pero en
// GitHub Pages el sitio se sirve bajo una subruta (p. ej.
// "/Comunicar-eventos-adversos/"), así que una ruta absoluta literal apuntaría al
// dominio raíz, no al sitio. `import.meta.env.BASE_URL` es el valor real de
// `base` de vite.config.ts en cada entorno (local: "/"; Pages: la subruta).
export function rutaPublica(ruta: string): string {
  return `${import.meta.env.BASE_URL}${ruta.replace(/^\//, '')}`;
}
