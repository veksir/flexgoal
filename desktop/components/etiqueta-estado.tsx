import { Check, CircleDashed, CircleSlash, Minus, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstadoMeta, EstadoSesion, EstadoTarea } from '@/lib/flexgoal/types'

/**
 * Todo estado lleva ícono + texto, nunca solo color (accesibilidad + tono).
 * Ningún estado usa rojo: "omitida" no es un error, es un dato.
 */

const base =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none'

const SESION: Record<
  EstadoSesion,
  { texto: string; Icono: typeof Check; clase: string }
> = {
  planificada: {
    texto: 'Planificada',
    Icono: CircleDashed,
    clase: 'border-dashed text-muted-foreground',
  },
  hecha: {
    texto: 'Hecha',
    Icono: Check,
    clase: 'border-primary/30 bg-signal-soft text-foreground',
  },
  parcial: {
    texto: 'Parcial',
    Icono: Minus,
    clase: 'border-border bg-muted text-muted-foreground',
  },
  omitida: {
    texto: 'No fue ese día',
    Icono: CircleSlash,
    clase: 'border-border text-muted-foreground',
  },
}

export function EtiquetaEstadoSesion({ estado }: { estado: EstadoSesion }) {
  const { texto, Icono, clase } = SESION[estado]
  return (
    <span className={cn(base, clase)}>
      <Icono className="size-3" aria-hidden />
      {texto}
    </span>
  )
}

const TAREA: Record<EstadoTarea, { texto: string; Icono: typeof Check }> = {
  pendiente: { texto: 'Sin empezar', Icono: CircleDashed },
  en_progreso: { texto: 'En curso', Icono: Minus },
  hecha: { texto: 'Hecha', Icono: Check },
  omitida: { texto: 'Omitida', Icono: CircleSlash },
}

export function EtiquetaEstadoTarea({ estado }: { estado: EstadoTarea }) {
  const { texto, Icono } = TAREA[estado]
  return (
    <span
      className={cn(
        base,
        estado === 'hecha'
          ? 'border-primary/30 bg-signal-soft text-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      <Icono className="size-3" aria-hidden />
      {texto}
    </span>
  )
}

const META: Record<EstadoMeta, { texto: string; Icono: typeof Check }> = {
  activa: { texto: 'Activa', Icono: Minus },
  pausada: { texto: 'Pausada', Icono: Pause },
  completada: { texto: 'Completada', Icono: Check },
  archivada: { texto: 'Archivada', Icono: CircleSlash },
}

export function EtiquetaEstadoMeta({ estado }: { estado: EstadoMeta }) {
  const { texto, Icono } = META[estado]
  return (
    <span
      className={cn(
        base,
        estado === 'activa'
          ? 'border-primary/30 bg-signal-soft text-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      <Icono className="size-3" aria-hidden />
      {texto}
    </span>
  )
}
