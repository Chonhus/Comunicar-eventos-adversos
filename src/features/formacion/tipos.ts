export interface BloqueFormacion {
  id: number;
  titulo: string;
  contenido: string[];
  puntosClave?: string[];
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
