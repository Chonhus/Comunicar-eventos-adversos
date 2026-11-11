export interface PasoVideo {
  tipo: 'video';
  titulo: string;
  descripcion?: string;
  /** Id del vídeo de YouTube (lo que va después de youtu.be/ o ?v=), no la URL completa. */
  youtubeId: string;
}

export interface OpcionTest {
  texto: string;
  correcta: boolean;
}

export interface PreguntaTest {
  id: number;
  enunciado: string;
  opciones: OpcionTest[];
}

export interface PasoPreguntas {
  tipo: 'preguntas';
  preguntas: PreguntaTest[];
}

export type PasoFormacion = PasoVideo | PasoPreguntas;
