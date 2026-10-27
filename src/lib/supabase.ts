import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[supabase] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.',
  );
}

// createClient() revienta si se le pasa una clave vacía (no solo "falsy", literalmente
// lanza "supabaseKey is required"). Con un valor de relleno no revienta al arrancar;
// cualquier llamada real seguirá fallando igual que el resto de la app cuando falta
// configuración (error de red claro, no un crash del módulo).
export const supabase = createClient(url || 'http://localhost:0', anonKey || 'config-pendiente');
