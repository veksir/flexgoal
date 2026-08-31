'use client'

import Link from 'next/link'
import { CircleDashed, Equal, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COPY_CARGA, formatoMin, type Carga } from '@/lib/flexgoal/engine'

/**
 * Elemento firma de la app: una regla de capacidad.
 * El plan se dibuja como segmentos sobre una regla que representa el tiempo
 * declarado. Si el plan la excede, el exceso se dibuja FUERA de la regla —
 * el mensaje es "sobra plan", nunca "faltaste".
 */

const ICONO: Record<Carga['estado'], typeof Info> = {
  sin_datos: CircleDashed,
  holgado: Equal,
  ajustado: Info,
  excedido: TriangleAlert,
}

export function MedidorCapacidad({
  carga,
  segmentos,
  hrefDisponibilidad = '/tiempo',
  horario,
}: {
  carga: Carga
  /** Bloques del plan en orden, para leer la composición del día. */
  segmentos: { id: string; etiqueta: string; minutos: number }[]
  hrefDisponibilidad?: string
  /** Franja horaria declarada para este día, si la hay (ver Tiempo →
   * "¿A qué hora?"). Puramente informativo. */
  horario?: { inicio: string; fin: string }
}) {
  const copy = COPY_CARGA[carga.estado]
  const Icono = ICONO[carga.estado]

  // Escala: el mayor entre disponible y plan, para que el exceso se vea salir.
  const escala = Math.max(carga.minutosDisponibles, carga.minutosPlan, 1)
  const anchoDisponible = (carga.minutosDisponibles / escala) * 100

  return (
    <section
      aria-labelledby="titulo-capacidad"
      className="bg-card overflow-hidden rounded-xl border"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 pad-card">
        <div className="min-w-0">
          <p className="label-instrumento text-muted-foreground">
            Capacidad del día
          </p>
          <h2
            id="titulo-capacidad"
            className="mt-2 flex items-baseline gap-2 text-3xl font-semibold tracking-tight"
          >
            <span className="tnum">{formatoMin(carga.minutosPlan)}</span>
            {carga.declarada && (
              <span className="text-muted-foreground text-base font-normal">
                de <span className="tnum">{formatoMin(carga.minutosDisponibles)}</span>
              </span>
            )}
          </h2>
          {horario && (
            <p className="text-muted-foreground mt-1 text-[12px]">
              Tu franja libre: <span className="tnum">{horario.inicio}</span> a{' '}
              <span className="tnum">{horario.fin}</span>
            </p>
          )}
        </div>

        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
            carga.estado === 'excedido' &&
              'border-signal-attention/40 bg-signal-attention-soft',
            carga.estado === 'ajustado' && 'border-border bg-muted',
            carga.estado === 'holgado' && 'border-border bg-signal-soft',
            carga.estado === 'sin_datos' && 'border-dashed bg-transparent',
          )}
        >
          <Icono
            className={cn(
              'mt-px size-4 shrink-0',
              carga.estado === 'excedido'
                ? 'text-signal-attention'
                : 'text-muted-foreground',
            )}
            aria-hidden
          />
          <div className="max-w-[24ch]">
            <p className="font-medium">{copy.titulo}</p>
            <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">
              {copy.detalle}
            </p>
          </div>
        </div>
      </div>

      {/* La regla */}
      <div className="pb-4 pad-card pt-0">
        {carga.declarada ? (
          <>
            <div className="relative h-9">
              {/* Canal del tiempo declarado */}
              <div
                className="bg-muted absolute inset-y-2 left-0 rounded-sm"
                style={{ width: `${anchoDisponible}%` }}
                aria-hidden
              />
              {/* Borde del límite declarado */}
              <div
                className="border-foreground/40 absolute inset-y-0 border-l border-dashed"
                style={{ left: `${anchoDisponible}%` }}
                aria-hidden
              />
              {/* Segmentos del plan */}
              <div className="absolute inset-y-2 left-0 flex w-full gap-px">
                {segmentos.map((s, i) => (
                  <div
                    key={s.id}
                    title={`${s.etiqueta} · ${formatoMin(s.minutos)}`}
                    style={{ width: `${(s.minutos / escala) * 100}%` }}
                    className={cn(
                      'h-full min-w-[2px] first:rounded-l-sm last:rounded-r-sm',
                      i % 2 === 0 ? 'bg-primary' : 'bg-primary/70',
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
              <span className="label-instrumento">0</span>
              {carga.estado === 'excedido' ? (
                <span className="text-signal-attention font-medium">
                  {formatoMin(carga.minutosPlan - carga.minutosDisponibles)} de plan
                  fuera del límite
                </span>
              ) : (
                <span>
                  <span className="tnum">{formatoMin(carga.minutosLibres)}</span> sin
                  asignar
                </span>
              )}
              <span className="label-instrumento">
                {formatoMin(carga.minutosDisponibles)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span className="tnum font-medium">
                {formatoMin(carga.minutosPlan)}
              </span>
              <span className="text-muted-foreground">
                planificados. No calculamos sobrecarga porque todavía no declaraste
                tu tiempo para hoy.
              </span>
            </div>
            <Link
              href={hrefDisponibilidad}
              className="border-border hover:bg-accent focus-visible:ring-ring inline-flex h-9 shrink-0 items-center justify-center rounded-md border px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Declarar mi tiempo
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
