'use client'

import { ChevronLeft, ChevronRight, CircleSlash } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  calcularCarga,
  formatoMin,
  indiceDia,
  sumarDias,
  type Carga,
  type ContextoSesion,
} from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'

export function ColumnaDia({
  fecha,
  etiqueta,
  numero,
  esHoy,
  sesiones,
  carga,
}: {
  fecha: string
  etiqueta: string
  numero: number
  esHoy: boolean
  sesiones: ContextoSesion[]
  carga: Carga
}) {
  const { estado, reprogramarSesion } = useFlexgoal()

  function moverSesion(sesion: ContextoSesion['sesion'], tareaTitulo: string, fechaDestino: string) {
    const minutosYaEnDestino = estado.sesiones
      .filter((s) => s.fecha === fechaDestino && s.id !== sesion.id)
      .reduce((acc, s) => acc + s.minutosPlan, 0)
    const disponibilidadDestino = estado.disponibilidad.find(
      (d) => d.dia === indiceDia(fechaDestino),
    )
    const cargaDestino = calcularCarga(
      minutosYaEnDestino + sesion.minutosPlan,
      disponibilidadDestino,
    )

    if (cargaDestino.estado === 'excedido') {
      const seguir = window.confirm(
        `Mover "${tareaTitulo}" a ese día lo deja en ${formatoMin(cargaDestino.minutosPlan)} planificados sobre ${formatoMin(cargaDestino.minutosDisponibles)} disponibles — se excede por ${formatoMin(cargaDestino.minutosPlan - cargaDestino.minutosDisponibles)}. ¿Moverla igual?`,
      )
      if (!seguir) return
    } else if (!cargaDestino.declarada) {
      const seguir = window.confirm(
        `Ese día no tiene tiempo declarado en Tiempo, así que no podemos avisarte si se sobrecarga. ¿Moverla igual?`,
      )
      if (!seguir) return
    }

    reprogramarSesion(sesion.id, fechaDestino)
  }

  return (
    <section
      aria-label={`${etiqueta} ${numero}`}
      className={cn(
        'bg-card flex flex-col rounded-lg border',
        esHoy && 'border-primary/50 ring-primary/15 ring-2',
      )}
    >
      <header className="flex items-baseline justify-between gap-2 border-b px-3 py-2.5">
        <div className="flex items-baseline gap-1.5">
          <span className="label-instrumento text-muted-foreground">
            {etiqueta}
          </span>
          <span className="tnum text-[15px] font-semibold">{numero}</span>
        </div>
        {esHoy && (
          <span className="text-primary label-instrumento">Hoy</span>
        )}
      </header>

      {/* Barra de carga del día */}
      <div className="px-3 pt-3">
        {carga.declarada ? (
          <>
            <div
              className="bg-muted relative h-1.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`${formatoMin(carga.minutosPlan)} planificados de ${formatoMin(carga.minutosDisponibles)} declarados`}
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full',
                  carga.estado === 'excedido'
                    ? 'bg-signal-attention'
                    : 'bg-primary',
                )}
                style={{ width: `${Math.min(100, carga.ratio * 100)}%` }}
              />
            </div>
            <p
              className={cn(
                'mt-1.5 text-[11px]',
                carga.estado === 'excedido'
                  ? 'text-signal-attention font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <span className="tnum">{formatoMin(carga.minutosPlan)}</span> /{' '}
              <span className="tnum">{formatoMin(carga.minutosDisponibles)}</span>
              {carga.estado === 'excedido' && ' · excede'}
            </p>
          </>
        ) : (
          <>
            <div
              className="border-border h-1.5 rounded-full border border-dashed"
              aria-hidden
            />
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              <span className="tnum">{formatoMin(carga.minutosPlan)}</span> · sin
              tiempo declarado
            </p>
          </>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-row p-3">
        {sesiones.length === 0 ? (
          <li className="text-muted-foreground/70 py-4 text-center text-[13px]">
            Día libre
          </li>
        ) : (
          sesiones.map(({ sesion, tarea, meta }) => (
            <li
              key={sesion.id}
              className={cn(
                'group bg-muted/50 rounded-md border-l-2 px-2.5 py-2',
                sesion.estado === 'hecha' && 'border-l-primary',
                sesion.estado === 'parcial' && 'border-l-primary/40',
                sesion.estado === 'omitida' &&
                  'border-l-border text-muted-foreground',
                sesion.estado === 'planificada' && 'border-l-foreground/25',
              )}
            >
              <p className="text-[13px] leading-snug font-medium">
                {tarea.titulo}
              </p>
              <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                {meta.titulo}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="tnum text-muted-foreground text-[11px]">
                  {sesion.minutosReal !== null
                    ? `${sesion.minutosReal}/${sesion.minutosPlan} min`
                    : `${sesion.minutosPlan} min`}
                </span>
                {sesion.estado === 'planificada' && (
                  <div className="flex gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moverSesion(sesion, tarea.titulo, sumarDias(fecha, -1))}
                      aria-label={`Mover ${tarea.titulo} al día anterior`}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <ChevronLeft className="size-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverSesion(sesion, tarea.titulo, sumarDias(fecha, 1))}
                      aria-label={`Mover ${tarea.titulo} al día siguiente`}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <ChevronRight className="size-3.5" aria-hidden />
                    </button>
                  </div>
                )}
                {sesion.estado === 'omitida' && (
                  <CircleSlash
                    className="text-muted-foreground size-3.5"
                    aria-label="No fue ese día"
                  />
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
