import { z } from 'zod';

export const EmocionSchema = z.enum(['neutral', 'preocupado', 'enfadado', 'triste', 'aliviado']);
export type Emocion = z.infer<typeof EmocionSchema>;

const CamaraSchema = z.object({
  vista: z.string(),
  cameraDistance: z.number(),
  cameraY: z.number(),
});

const AvatarCasoSchema = z.object({
  nombre: z.string(),
  rol: z.string(),
  edad: z.number().int().positive(),
  glb: z.string(),
  imagenRespaldo: z.string(),
  fondo: z.string(),
  camara: CamaraSchema,
  pose: z.string(),
  body: z.enum(['M', 'F']),
});

export const CasoSchema = z.object({
  id: z.string(),
  nivel: z.number().int().positive(),
  titulo: z.string(),
  dificultad: z.enum(['sencillo', 'dificil']),
  avatar: AvatarCasoSchema,
  mostrarItemsEnBriefing: z.boolean(),
  briefingRef: z.string(),
  hechosReferenciaRef: z.string(),
  voz: z.string(),
  modeloPersonaje: z.string(),
  emocionInicial: EmocionSchema,
  fraseApertura: z.string(),
  personajeRef: z.string(),
});
export type Caso = z.infer<typeof CasoSchema>;

export const CasosConfigSchema = z.object({
  maxIntentos: z.number().int().positive(),
  duracionMaximaSeg: z.number().int().positive(),
  avisoDuracionSeg: z.number().int().positive(),
  requisitoDesbloqueo: z.object({
    nivel: z.number().int(),
    requiereNivel: z.number().int(),
    puntuacionMinima: z.number(),
  }),
  casos: z.array(CasoSchema).min(1),
});
export type CasosConfig = z.infer<typeof CasosConfigSchema>;

export const ChecklistItemSchema = z.object({
  id: z.string(),
  etiqueta: z.string(),
  tipo: z.enum(['nucleo', 'recomendado']),
  peso: z.number(),
  activo: z.boolean(),
  definicion: z.string(),
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const AlertaSchema = z.object({
  id: z.string(),
  etiqueta: z.string(),
  penalizacion: z.number(),
  definicion: z.string(),
});
export type Alerta = z.infer<typeof AlertaSchema>;

export const ChecklistConfigSchema = z.object({
  items: z.array(ChecklistItemSchema).min(1),
  alertas: z.array(AlertaSchema),
});
export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;

export const MotorConfigSchema = z.object({
  motor: z.enum(['propio', 'convai']),
  stt: z.object({
    proveedor: z.enum(['webspeech', 'azure']),
    idioma: z.string(),
    alternativas: z.array(z.string()),
  }),
  tts: z.object({
    proveedor: z.enum(['azure', 'elevenlabs', 'navegador']),
    region: z.string(),
    alternativas: z.array(z.string()),
  }),
  turnos: z.object({
    silencioFinTurnoMs: z.number().int().positive(),
    bargeInMinMs: z.number().int().positive(),
    bargeInMinPalabras: z.number().int().positive(),
    silencioIncomodoMs: z.number().int().positive(),
  }),
  llm: z.object({
    personaje: z.string(),
    detector: z.string(),
    evaluador: z.string(),
    maxTokensPersonaje: z.number().int().positive(),
  }),
  latenciaObjetivoMs: z.number().int().positive(),
  debug: z.object({
    modoTextoParam: z.string(),
  }),
});
export type MotorConfig = z.infer<typeof MotorConfigSchema>;

// config/poses.json — plantillas poseTemplates de TalkingHead (docs/AVATARES.md §1):
// props con claves "Hueso.rotation" (Euler XYZ radianes), "Hueso.quaternion" o "Hueso.position" (metros).
const VectorOCuaternionSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  w: z.number().optional(),
});

export const PoseTemplateSchema = z.object({
  standing: z.boolean().optional(),
  sitting: z.boolean().optional(),
  bend: z.boolean().optional(),
  kneeling: z.boolean().optional(),
  lying: z.boolean().optional(),
  props: z.record(z.string(), VectorOCuaternionSchema),
});
export type PoseTemplate = z.infer<typeof PoseTemplateSchema>;

export const PosesConfigSchema = z.record(z.string(), PoseTemplateSchema);
export type PosesConfig = z.infer<typeof PosesConfigSchema>;
