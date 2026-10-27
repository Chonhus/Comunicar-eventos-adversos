// docs/MOTOR.md §7 — trocea el texto en streaming en frases para poder empezar a
// sintetizar voz lo antes posible, sin cortar mal abreviaturas habituales.
const ABREVIATURAS = new Set([
  'dr', 'dra', 'sr', 'sra', 'srta', 'ud', 'uds', 'p', 'ej', 'etc', 'núm', 'n.º', 'prof',
]);

const LIMITE_COMA_POR_DEFECTO = 120;

export class FraseBuffer {
  private buffer = '';

  constructor(
    private readonly onFrase: (frase: string) => void,
    private readonly limiteComa = LIMITE_COMA_POR_DEFECTO,
  ) {}

  agregar(chunk: string): void {
    this.buffer += chunk;
    this.procesar();
  }

  /** Vacía lo que quede en el buffer (fin del stream). */
  finalizar(): void {
    const resto = this.buffer.trim();
    this.buffer = '';
    if (resto) this.onFrase(resto);
  }

  private procesar(): void {
    const regex = /([.?!…;])(\s+)/g;
    let match: RegExpExecArray | null;
    let cortadoHasta = 0;

    while ((match = regex.exec(this.buffer))) {
      const finFrase = match.index + match[1].length;
      const candidata = this.buffer.slice(cortadoHasta, finFrase).trim();
      if (this.terminaEnAbreviatura(candidata)) continue;
      if (candidata) this.onFrase(candidata);
      cortadoHasta = match.index + match[0].length;
    }

    if (cortadoHasta > 0) {
      this.buffer = this.buffer.slice(cortadoHasta);
      return;
    }

    if (this.buffer.length > this.limiteComa) {
      const idxComa = this.buffer.lastIndexOf(',', this.buffer.length);
      if (idxComa > 0) {
        const candidata = this.buffer.slice(0, idxComa + 1).trim();
        this.buffer = this.buffer.slice(idxComa + 1);
        if (candidata) this.onFrase(candidata);
      }
    }
  }

  private terminaEnAbreviatura(candidata: string): boolean {
    const palabras = candidata.split(/\s+/);
    const ultima = palabras[palabras.length - 1]?.toLowerCase().replace(/\.+$/, '');
    return !!ultima && ABREVIATURAS.has(ultima);
  }
}
