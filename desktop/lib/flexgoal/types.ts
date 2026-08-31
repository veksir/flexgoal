/**
 * Modelo de dominio de flexgoal.
 * Cadena: Idea -> Meta -> Objetivo -> Tarea -> Sesión -> Tiempo
 * Todo vive en el dispositivo (local-first). Nada se sincroniza.
 */

export type EstadoIdea = 'inbox' | 'promovida' | 'descartada'
export type EstadoMeta = 'activa' | 'pausada' | 'completada' | 'archivada'
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'hecha' | 'omitida'
export type EstadoSesion = 'planificada' | 'hecha' | 'parcial' | 'omitida'

export interface Idea {
  id: string
  titulo: string
  notas?: string
  estado: EstadoIdea
  creadaEn: string
  metaId?: string
}

export interface Meta {
  id: string
  titulo: string
  porQue: string
  horizonte: string
  estado: EstadoMeta
  creadaEn: string
}

export interface Objetivo {
  id: string
  metaId: string
  titulo: string
  criterioExito: string
  orden: number
}

export interface Tarea {
  id: string
  objetivoId: string
  titulo: string
  estimacionMin: number
  estado: EstadoTarea
  /** Ajuste acumulado aceptado por la persona, en minutos. Nunca se aplica solo. */
  ajusteAceptadoMin: number
}

export interface Sesion {
  id: string
  tareaId: string
  /** ISO date, sin hora: YYYY-MM-DD */
  fecha: string
  minutosPlan: number
  minutosReal: number | null
  estado: EstadoSesion
  nota?: string
}

export interface Disponibilidad {
  /** 0 = lunes … 6 = domingo */
  dia: number
  minutos: number
  /** Falso = la persona no declaró nada. Sin dato NO es sobrecarga. */
  declarada: boolean
  /** Rango horario dentro del cual está ese tiempo libre — opcional,
   * "HH:MM". Si no se especifica, solo se sabe CUÁNTO tiempo hay ese
   * día, no A QUÉ HORA. Ninguna parte del motor de cálculo depende de
   * esto (la carga se sigue calculando por minutos totales) — es
   * puramente informativo, para saber en qué franja conviene mirar
   * ese día. */
  horaInicio?: string
  horaFin?: string
}

export interface EstadoApp {
  version: number
  ideas: Idea[]
  metas: Meta[]
  objetivos: Objetivo[]
  tareas: Tarea[]
  sesiones: Sesion[]
  disponibilidad: Disponibilidad[]
  /** Sugerencias ya vistas y descartadas, para no repetir ruido. */
  sugerenciasDescartadas: string[]
}

export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const
export const DIAS_LARGOS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const
