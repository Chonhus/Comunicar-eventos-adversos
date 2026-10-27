// Extrae la etiqueta [emocion] inicial que el personaje añade a cada respuesta
// (docs/MOTOR.md §6) a partir de fragmentos en streaming, que pueden llegar partidos
// en cualquier punto (p. ej. "[neu" + "tral] Hola").
import { EmocionSchema, type Emocion } from '@/lib/config/schemas';

const EMOCIONES_VALIDAS = new Set<string>(EmocionSchema.options);
const LONGITUD_MAX_ESPERA = 20; // si no cierra "]" en este margen, no era una etiqueta

export interface ResultadoExtraccion {
  emocion: Emocion | null;
  texto: string;
}

export class ExtractorEmocion {
  private buffer = '';
  private resuelto = false;

  procesar(chunk: string): ResultadoExtraccion {
    if (this.resuelto) return { emocion: null, texto: chunk };

    this.buffer += chunk;

    if (this.buffer.length > 0 && !this.buffer.startsWith('[')) {
      return this.resolverSinEtiqueta();
    }

    const fin = this.buffer.indexOf(']');
    if (fin === -1) {
      if (this.buffer.length > LONGITUD_MAX_ESPERA) return this.resolverSinEtiqueta();
      return { emocion: null, texto: '' }; // seguimos esperando el cierre
    }

    const etiqueta = this.buffer.slice(1, fin).trim();
    const resto = this.buffer.slice(fin + 1).replace(/^\s+/, '');
    this.resuelto = true;
    this.buffer = '';
    return {
      emocion: EMOCIONES_VALIDAS.has(etiqueta) ? (etiqueta as Emocion) : null,
      texto: resto,
    };
  }

  private resolverSinEtiqueta(): ResultadoExtraccion {
    this.resuelto = true;
    const texto = this.buffer;
    this.buffer = '';
    return { emocion: null, texto };
  }
}
