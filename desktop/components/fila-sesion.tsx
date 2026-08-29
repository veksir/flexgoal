'use client'

import { useState } from 'react'
import {
  Check,
  ChevronDown,
  CircleSlash,
  CornerDownRight,
  Minus,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatoMin, type ContextoSesion } from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { EtiquetaEstadoSesion } from '@/components/etiqueta-estado'

export function FilaSesion({
  ctx,
  siguienteFecha,
}: {
  ctx: ContextoSesion
  siguienteFecha: string
}) {
  const { sesion, tarea, objetivo, meta } = ctx
  const { registrarSesion, omitirSesion, reprogramarSesion, moverMinutos } =
    useFlexgoal()
  const [abierto, setAbierto] = useState(false)
  const [real, setReal] = useState(sesion.minutosPlan)

  const cerrada = sesion.estado !== 'planificada'
  const delta =
    sesion.minutosReal === null ? null : sesion.minutosReal - sesion.minutosPlan

  return (
    <li
      className={cn(
        'bg-card rounded-lg border transition-colors',
        cerrada && 'bg-card/50',
      )}
    >
      <div className="flex items-start gap-3 pad-card">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                'text-[15px] leading-snug font-medium',
                sesion.estado === 'omitida' && 'text-muted-foreground',
              )}
            >
              {tarea.titulo}
            </h3>
            <EtiquetaEstadoSesion estado={sesion.estado} />
          </div>

          <p className="text-muted-foreground mt-1 truncate text-[13px]">
            {meta.titulo} <span aria-hidden>·</span> {objetivo.titulo}
          </p>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="tnum">
              Plan {formatoMin(sesion.minutosPlan)}
            </span>
            {sesion.minutosReal !== null && (
              <span className="tnum">
                Real {formatoMin(sesion.minutosReal)}
              </span>
            )}
            {delta !== null && delta !== 0 && (
              <span className="tnum text-foreground/70">
                {delta > 0 ? '+' : ''}
                {delta} min vs. plan
              </span>
            )}
            {tarea.ajusteAceptadoMin !== 0 && (
              <span className="tnum">
                Ajuste aceptado {tarea.ajusteAceptadoMin > 0 ? '+' : ''}
                {tarea.ajusteAceptadoMin} min
              </span>
            )}
          </div>

          {sesion.nota && (
            <p className="text-muted-foreground mt-2 border-l-2 pl-2 text-[13px] italic">
              {sesion.nota}
            </p>
          )}
        </div>

        {!cerrada && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => moverMinutos(sesion.id, -5)}
              aria-label={`Restar 5 minutos al plan de ${tarea.titulo}`}
              className="hover:bg-accent focus-visible:ring-ring text-muted-foreground hover:text-foreground flex size-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => moverMinutos(sesion.id, 5)}
              aria-label={`Sumar 5 minutos al plan de ${tarea.titulo}`}
              className="hover:bg-accent focus-visible:ring-ring text-muted-foreground hover:text-foreground flex size-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {!cerrada && (
        <div className="flex flex-wrap items-center gap-2 border-t px-[var(--pad-card)] py-2.5">
          <Button
            size="sm"
            onClick={() => registrarSesion(sesion.id, sesion.minutosPlan)}
            className="h-9"
          >
            <Check className="size-4" aria-hidden />
            Hecha
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="h-9"
          >
            Registrar otro tiempo
            <ChevronDown
              className={cn('size-4 transition-transform', abierto && 'rotate-180')}
              aria-hidden
            />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => reprogramarSesion(sesion.id, siguienteFecha)}
            className="text-muted-foreground h-9"
          >
            <CornerDownRight className="size-4" aria-hidden />
            Mover a mañana
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => omitirSesion(sesion.id)}
            className="text-muted-foreground h-9"
          >
            <CircleSlash className="size-4" aria-hidden />
            No fue hoy
          </Button>
        </div>
      )}

      {abierto && !cerrada && (
        <div className="bg-muted/40 space-y-3 border-t px-[var(--pad-card)] py-3">
          <label
            htmlFor={`real-${sesion.id}`}
            className="text-muted-foreground block text-[13px]"
          >
            ¿Cuántos minutos le diste? Sirve para afinar la estimación, nada más.
          </label>
          <div className="flex items-center gap-3">
            <input
              id={`real-${sesion.id}`}
              type="range"
              min={0}
              max={Math.max(120, sesion.minutosPlan * 2)}
              step={5}
              value={real}
              onChange={(e) => setReal(Number(e.target.value))}
              className="accent-primary h-11 flex-1"
            />
            <span className="tnum w-16 text-right text-sm font-medium">
              {real} min
            </span>
            <Button
              size="sm"
              className="h-9"
              onClick={() => {
                registrarSesion(sesion.id, real)
                setAbierto(false)
              }}
            >
              Guardar
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
