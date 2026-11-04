// iOS Safari suspende (o marca "interrupted") los AudioContext al pasar la pestaña a
// segundo plano, y solo los reactiva con un toque real del usuario después — no con
// resume() llamado por nuestro propio código fuera de un gesto. Bug real reportado: tras
// minimizar Safari durante una llamada, el avatar se quedaba mudo (el texto seguía
// llegando, pero sin audio) incluso volviendo a primer plano.
// TalkingHead ya intenta resume() por su cuenta en cada frase (verificado en
// node_modules/@met4citizen/talkinghead: comprueba state "suspended"/"interrupted"), pero
// sin un gesto real ese resume() no reactiva nada en iOS. Aquí se registran todos los
// AudioContext en juego (el de AzureTTS y el interno de TalkingHead) para poder
// reintentar resume() en el siguiente toque real tras volver de segundo plano
// (ver useLlamada.ts).
const contextos = new Set<AudioContext>();

export function registrarAudioContextActivo(ctx: AudioContext): void {
  contextos.add(ctx);
}

export function reanudarAudioContextsActivos(): void {
  for (const ctx of contextos) {
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      ctx.resume().catch(() => {
        // Mejor esfuerzo: si falla, el aviso de TalkingHead en consola ya lo explica.
      });
    }
  }
}
