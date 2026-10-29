// Lógica común a MotorPropio y MotorTexto: turno -> conversar (streaming) -> FraseBuffer
// -> cola de TTS, en paralelo detectar-items. Lo único que cambia entre implementaciones
// es cómo llega el turno del alumno (micrófono vs texto) — ver docs/MOTOR.md §2.
import type { Caso, MotorConfig } from '@/lib/config/schemas';
import { ChecklistEngine } from '@/features/llamada/ChecklistEngine';
import { checklistConfig } from '@/lib/config';
import { EmisorEventos } from './EmisorEventos';
import { ExtractorEmocion } from './ExtractorEmocion';
import { FraseBuffer } from './FraseBuffer';
import { MaquinaTurnos } from './maquinaTurnos';
import { llamarConversar } from './llamarConversar';
import { llamarDetectarItems } from './llamarDetectarItems';
import { crearProveedorTTS } from './tts';
import type { ProveedorTTS } from './tts/tipos';
import type { EventosMotor, MotorConversacion, TurnoHistorial } from './tipos';

const MAX_TURNOS_CONTEXTO = 12;
const MAX_TURNOS_CONTEXTO_DETECTOR = 6;

export abstract class MotorBase implements MotorConversacion {
  protected emisor = new EmisorEventos<EventosMotor>();
  protected maquina = new MaquinaTurnos();
  protected tts: ProveedorTTS = crearProveedorTTS();
  protected checklist: ChecklistEngine;
  protected caso!: Caso;
  protected historial: TurnoHistorial[] = [];

  private colaFrases: Array<string | null> = [];
  private reproduciendo = false;
  private abortConversar: AbortController | null = null;
  private timeoutApertura: ReturnType<typeof setTimeout> | null = null;
  // Para medir primerAudioMs (docs/CLAUDE.md: "Medir y mostrar tiempos en modo debug",
  // objetivo < 2 s): antes se emitía siempre null, porque el evento 'metricas' salía
  // justo al terminar el stream de texto, antes incluso de que procesarColaSiLibre()
  // llegara a reproducir la primera frase. Ahora se mide de verdad con el callback
  // onInicio de la primera frase de cada respuesta (ver procesarColaSiLibre/emitirPrimerAudio).
  private metricasActuales: { t0: number; primerTokenMs: number | null } | null = null;

  constructor(protected readonly config: MotorConfig) {
    this.checklist = new ChecklistEngine(checklistConfig.items.map((i) => i.id));
  }

  on<K extends keyof EventosMotor>(evento: K, cb: EventosMotor[K]): void {
    this.emisor.on(evento, cb);
  }

  off<K extends keyof EventosMotor>(evento: K, cb: EventosMotor[K]): void {
    this.emisor.off(evento, cb);
  }

  abstract iniciar(caso: Caso): Promise<void>;
  abstract detener(): Promise<void>;
  abstract silenciarMicro(silenciado: boolean): void;

  enviarTexto(texto: string): void {
    this.procesarTurnoAlumno(texto);
  }

  obtenerChecklist(): ChecklistEngine {
    return this.checklist;
  }

  protected pararTodo(): void {
    this.tts.detener();
    this.abortConversar?.abort();
    this.cancelarApertura();
  }

  protected interrumpir(): void {
    if (!this.maquina.interrumpir()) return;
    this.pararTodo();
    this.colaFrases = [];
    this.reproduciendo = false;
    this.emisor.emit('estado', 'escuchando');
  }

  /** Si el alumno tarda en hablar al empezar la llamada, el avatar rompe el hielo (docs/MOTOR.md §6). */
  protected programarAperturaSiSilencio(): void {
    this.cancelarApertura();
    this.timeoutApertura = setTimeout(() => {
      if (this.maquina.estadoActual === 'escuchando') this.reproducirApertura();
    }, this.config.turnos.silencioIncomodoMs);
  }

  protected cancelarApertura(): void {
    if (this.timeoutApertura) {
      clearTimeout(this.timeoutApertura);
      this.timeoutApertura = null;
    }
  }

  private reproducirApertura(): void {
    const frase = this.caso.fraseApertura;
    if (!frase || !this.maquina.turnoFinalDetectado()) return;
    this.maquina.primerAudioListo();
    this.emisor.emit('estado', 'hablando');
    this.emisor.emit('emocion', this.caso.emocionInicial);
    this.emisor.emit('textoAvatar', { texto: frase, final: true });
    this.historial.push({ rol: 'avatar', texto: frase });
    this.tts
      .hablar(frase, this.caso.voz)
      .catch((e) => console.error('[tts] error en la frase de apertura:', e))
      .finally(() => {
        this.maquina.streamTerminadoYColaVacia();
        this.emisor.emit('estado', 'escuchando');
      });
  }

  protected procesarTurnoAlumno(texto: string): void {
    const limpio = texto.trim();
    if (!limpio) return;
    this.cancelarApertura();
    if (!this.maquina.turnoFinalDetectado()) return; // ya hay un turno en curso: se ignora

    this.emisor.emit('estado', 'pensando');
    this.emisor.emit('turnoAlumno', { texto: limpio, ts: Date.now() });
    const historialParaContexto = this.historial.slice(-MAX_TURNOS_CONTEXTO);
    this.historial.push({ rol: 'alumno', texto: limpio });

    void this.detectarItems(limpio, historialParaContexto.slice(-MAX_TURNOS_CONTEXTO_DETECTOR));
    void this.generarRespuesta(limpio, historialParaContexto);
  }

  private async detectarItems(turno: string, contexto: TurnoHistorial[]): Promise<void> {
    const resultado = await llamarDetectarItems({
      casoId: this.caso.id,
      pendientes: this.checklist.obtenerPendientes(),
      contexto,
      turno,
    });
    if (resultado) {
      this.checklist.aplicarDeteccion(resultado);
      this.emisor.emit('checklistActualizado', resultado);
    }
  }

  private async generarRespuesta(turnoAlumno: string, historialParaContexto: TurnoHistorial[]): Promise<void> {
    const extractor = new ExtractorEmocion();
    const fraseBuffer = new FraseBuffer((frase) => this.encolarFrase(frase));
    this.abortConversar = new AbortController();

    const metricas = { t0: performance.now(), primerTokenMs: null as number | null };
    this.metricasActuales = metricas;
    let textoCompleto = '';
    let emocionEmitida = false;

    try {
      await llamarConversar({
        casoId: this.caso.id,
        historial: historialParaContexto,
        turnoAlumno,
        signal: this.abortConversar.signal,
        onDelta: (delta) => {
          if (metricas.primerTokenMs === null) metricas.primerTokenMs = Math.round(performance.now() - metricas.t0);
          const { emocion, texto } = extractor.procesar(delta);
          if (emocion && !emocionEmitida) {
            this.emisor.emit('emocion', emocion);
            emocionEmitida = true;
          }
          if (texto) {
            textoCompleto += texto;
            this.emisor.emit('textoAvatar', { texto: textoCompleto, final: false });
            fraseBuffer.agregar(texto);
          }
        },
      });
      fraseBuffer.finalizar();
      if (textoCompleto) {
        this.emisor.emit('textoAvatar', { texto: textoCompleto, final: true });
        this.historial.push({ rol: 'avatar', texto: textoCompleto });
      }
      this.colaFrases.push(null); // marca de fin de stream
      this.procesarColaSiLibre();
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // barge-in: ya gestionado por interrumpir()
      console.error('[motor] error generando la respuesta del personaje:', e);
      this.colaFrases = [];
      if (this.maquina.estadoActual !== 'escuchando') {
        if (this.maquina.estadoActual === 'pensando') this.maquina.primerAudioListo();
        this.maquina.streamTerminadoYColaVacia();
      }
      this.emisor.emit('estado', 'error');
    }
  }

  private encolarFrase(frase: string): void {
    this.colaFrases.push(frase);
    this.procesarColaSiLibre();
  }

  private procesarColaSiLibre(): void {
    if (this.reproduciendo) return;
    const siguiente = this.colaFrases.shift();
    if (siguiente === undefined) return;

    if (siguiente === null) {
      if (this.colaFrases.length === 0 && this.maquina.estadoActual === 'hablando') {
        this.maquina.streamTerminadoYColaVacia();
        this.emisor.emit('estado', 'escuchando');
      }
      return;
    }

    this.reproduciendo = true;
    if (this.maquina.estadoActual === 'pensando') {
      this.maquina.primerAudioListo();
      this.emisor.emit('estado', 'hablando');
    }

    const metricas = this.metricasActuales;
    this.tts
      .hablar(siguiente, this.caso.voz, metricas ? { onInicio: () => this.emitirPrimerAudio(metricas) } : undefined)
      .catch((e) => console.error('[tts] error reproduciendo frase:', e))
      .finally(() => {
        this.reproduciendo = false;
        this.procesarColaSiLibre();
      });
  }

  /** Solo mide la primera frase de cada respuesta: metricasActuales se pone a null
   * aquí mismo para que las frases siguientes no vuelvan a disparar el callback. */
  private emitirPrimerAudio(metricas: { t0: number; primerTokenMs: number | null }): void {
    if (this.metricasActuales !== metricas) return; // ya es de otra respuesta (p.ej. tras interrumpir)
    this.metricasActuales = null;
    const primerAudioMs = Math.round(performance.now() - metricas.t0);
    this.emisor.emit('metricas', { sttMs: null, primerTokenMs: metricas.primerTokenMs, primerAudioMs });
  }

  protected reiniciarParaNuevaLlamada(caso: Caso): void {
    this.caso = caso;
    this.historial = [];
    this.checklist = new ChecklistEngine(checklistConfig.items.map((i) => i.id));
    this.maquina.reset();
    this.colaFrases = [];
    this.reproduciendo = false;
    this.metricasActuales = null;
  }
}
