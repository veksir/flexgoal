/**
 * Motor determinista de flexgoal.
 * Reglas duras del producto:
 *  - Sin disponibilidad declarada NO hay sobrecarga: hay "sin datos".
 *  - El ajuste sugerido es acotado: +15 min o -10 min. Nunca más.
 *  - El motor propone; la persona decide. Nada se aplica en silencio.
 *  - El tono es neutro: no existe "fallaste", existe "el plan no coincidió".
 */

import type {
  Disponibilidad,
  EstadoApp,
  Meta,
  Objetivo,
  Sesion,
  Tarea,
} from './types'

export type EstadoCarga = 'sin_datos' | 'holgado' | 'ajustado' | 'excedido'

export interface Carga {
  minutosPlan: number
  minutosDisponibles: number
  declarada: boolean
  estado: EstadoCarga
  /** 0..1+ — plan / disponible. 0 cuando no hay disponibilidad declarada. */
  ratio: number
  minutosLibres: number
}

export function calcularCarga(
  minutosPlan: number,
  disponibilidad: Disponibilidad | undefined,
): Carga {
  const declarada = Boolean(disponibilidad?.declarada)
  const minutosDisponibles = declarada ? (disponibilidad?.minutos ?? 0) : 0

  if (!declarada) {
    return {
      minutosPlan,
      minutosDisponibles: 0,
      declarada: false,
      estado: 'sin_datos',
      ratio: 0,
      minutosLibres: 0,
    }
  }

  const ratio = minutosDisponibles === 0 ? 2 : minutosPlan / minutosDisponibles
  const estado: EstadoCarga =
    ratio > 1 ? 'excedido' : ratio >= 0.85 ? 'ajustado' : 'holgado'

  return {
    minutosPlan,
    minutosDisponibles,
    declarada: true,
    estado,
    ratio,
    minutosLibres: Math.max(0, minutosDisponibles - minutosPlan),
  }
}

export const COPY_CARGA: Record<EstadoCarga, { titulo: string; detalle: string }> = {
  sin_datos: {
    titulo: 'Sin disponibilidad declarada',
    detalle: 'Podemos planificar igual. Declarar tu tiempo solo mejora el cálculo.',
  },
  holgado: {
    titulo: 'Hay margen',
    detalle: 'El plan entra en el tiempo que declaraste.',
  },
  ajustado: {
    titulo: 'Al límite',
    detalle: 'El plan usa casi todo tu tiempo declarado. Cualquier imprevisto lo mueve.',
  },
  excedido: {
    titulo: 'Plan mayor al tiempo declarado',
    detalle: 'No es un problema de disciplina: son más minutos de los que hay.',
  },
}

/* ----------------------------------------------------------------
   Desviación: real vs. plan
   ---------------------------------------------------------------- */

export function desviacion(sesion: Sesion): number | null {
  if (sesion.minutosReal === null) return null
  return sesion.minutosReal - sesion.minutosPlan
}

export interface Sugerencia {
  id: string
  tareaId: string
  tareaTitulo: string
  deltaMin: 15 | -10
  motivo: string
  muestras: number
}

/**
 * Regla determinista y explicable:
 *  - Necesita al menos 3 sesiones cerradas de la misma tarea.
 *  - Si la mediana de desviación supera +20% del plan -> sugerir +15 min.
 *  - Si queda por debajo de -20% del plan -> sugerir -10 min.
 *  - En cualquier otro caso, silencio. El ruido también es un costo.
 */
export function sugerirAjustes(estado: EstadoApp): Sugerencia[] {
  const porTarea = new Map<string, Sesion[]>()
  for (const s of estado.sesiones) {
    if (s.minutosReal === null || s.estado === 'omitida') continue
    const lista = porTarea.get(s.tareaId) ?? []
    lista.push(s)
    porTarea.set(s.tareaId, lista)
  }

  const salida: Sugerencia[] = []

  for (const [tareaId, sesiones] of porTarea) {
    if (sesiones.length < 3) continue
    const tarea = estado.tareas.find((t) => t.id === tareaId)
    if (!tarea || tarea.estado === 'hecha') continue

    const recientes = [...sesiones]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 5)

    const ratios = recientes
      .map((s) => (s.minutosReal! - s.minutosPlan) / Math.max(1, s.minutosPlan))
      .sort((a, b) => a - b)
    const mediana = ratios[Math.floor(ratios.length / 2)]

    const deltaMin: 15 | -10 | null =
      mediana > 0.2 ? 15 : mediana < -0.2 ? -10 : null
    if (deltaMin === null) continue

    const id = `${tareaId}:${deltaMin}`
    if (estado.sugerenciasDescartadas.includes(id)) continue

    const pct = Math.round(Math.abs(mediana) * 100)
    salida.push({
      id,
      tareaId,
      tareaTitulo: tarea.titulo,
      deltaMin,
      motivo:
        deltaMin === 15
          ? `Las últimas ${recientes.length} veces tomó ~${pct}% más que lo estimado.`
          : `Las últimas ${recientes.length} veces tomó ~${pct}% menos que lo estimado.`,
      muestras: recientes.length,
    })
  }

  return salida.sort((a, b) => a.tareaTitulo.localeCompare(b.tareaTitulo))
}

/* ----------------------------------------------------------------
   Consultas derivadas
   ---------------------------------------------------------------- */

export function estimacionEfectiva(tarea: Tarea): number {
  return Math.max(5, tarea.estimacionMin + tarea.ajusteAceptadoMin)
}

export function sesionesDelDia(estado: EstadoApp, fecha: string): Sesion[] {
  return estado.sesiones.filter((s) => s.fecha === fecha)
}

export function minutosPlanificados(sesiones: Sesion[]): number {
  return sesiones
    .filter((s) => s.estado !== 'omitida')
    .reduce((acc, s) => acc + s.minutosPlan, 0)
}

export function minutosRegistrados(sesiones: Sesion[]): number {
  return sesiones.reduce((acc, s) => acc + (s.minutosReal ?? 0), 0)
}

export interface ContextoSesion {
  sesion: Sesion
  tarea: Tarea
  objetivo: Objetivo
  meta: Meta
}

export function contextoDeSesion(
  estado: EstadoApp,
  sesion: Sesion,
): ContextoSesion | null {
  const tarea = estado.tareas.find((t) => t.id === sesion.tareaId)
  if (!tarea) return null
  const objetivo = estado.objetivos.find((o) => o.id === tarea.objetivoId)
  if (!objetivo) return null
  const meta = estado.metas.find((m) => m.id === objetivo.metaId)
  if (!meta) return null
  return { sesion, tarea, objetivo, meta }
}

export function progresoMeta(estado: EstadoApp, metaId: string) {
  const objetivos = estado.objetivos.filter((o) => o.metaId === metaId)
  const objetivoIds = new Set(objetivos.map((o) => o.id))
  const tareas = estado.tareas.filter((t) => objetivoIds.has(t.objetivoId))
  const hechas = tareas.filter((t) => t.estado === 'hecha').length
  const tareaIds = new Set(tareas.map((t) => t.id))
  const minutos = estado.sesiones
    .filter((s) => tareaIds.has(s.tareaId))
    .reduce((acc, s) => acc + (s.minutosReal ?? 0), 0)

  return {
    objetivos: objetivos.length,
    tareas: tareas.length,
    hechas,
    pct: tareas.length === 0 ? 0 : Math.round((hechas / tareas.length) * 100),
    minutosInvertidos: minutos,
  }
}

/* ----------------------------------------------------------------
   Fechas y formato
   ---------------------------------------------------------------- */

export function hoyISO(): string {
  const d = new Date()
  return isoDe(d)
}

export function isoDe(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** 0 = lunes … 6 = domingo */
export function indiceDia(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const js = new Date(y, m - 1, d).getDay()
  return (js + 6) % 7
}

export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  fecha.setDate(fecha.getDate() + dias)
  return isoDe(fecha)
}

export function inicioDeSemana(iso: string): string {
  return sumarDias(iso, -indiceDia(iso))
}

export function semanaDe(iso: string): string[] {
  const lunes = inicioDeSemana(iso)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
}

export function formatoMin(min: number): string {
  if (min <= 0) return '0 min'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m}`
}

export function fechaLegible(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
