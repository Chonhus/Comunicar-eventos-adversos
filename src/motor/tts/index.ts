import type { ProveedorTTS } from './tipos';
import { AzureTTS } from './AzureTTS';
import { NavegadorTTS } from './NavegadorTTS';
import { TTSConRespaldo } from './TTSConRespaldo';

export function crearProveedorTTS(): ProveedorTTS {
  return new TTSConRespaldo(new AzureTTS(), new NavegadorTTS());
}

export type { ProveedorTTS, ReproducirOpts } from './tipos';
