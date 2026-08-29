'use client'

import { useState } from 'react'
import { ChevronDown, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { estimacionEfectiva, fechaLegible, formatoMin } from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'
import type { Meta, Objetivo, Tarea } from '@/lib/flexgoal/types'
import { EtiquetaEstadoMeta, EtiquetaEstadoTarea } from '@/components/etiqueta-estado'

export function TarjetaMeta({
  meta,
  objetivos,
  progreso,
}: {
  meta: Meta
  objetivos: { objetivo: Objetivo; tareas: Tarea[] }[]
  progreso: {
    objetivos: number
    tareas: number
    hechas: number
    pct: number
    minutosInvertidos: number
  }
}) {
  const { alternarTarea, alternarEstadoMeta } = useFlexgoal()
  const [abierto, setAbierto] = useState(meta.estado === 'activa')

  return (
    <article
      className={cn(
        'bg-card overflow-hidden rounded-xl border',
        meta.estado !== 'activa' && 'bg-card/50',
      )}
    >
      <div className="pad-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base leading-snug font-semibold tracking-tight text-balance">
                {meta.titulo}
              </h3>
              <EtiquetaEstadoMeta estado={meta.estado} />
            </div>

            {/* El "por qué" es el ancla emocional del producto: se muestra siempre */}
            <div className="text-muted-foreground mt-2.5 flex gap-2 text-[13px] leading-relaxed">
              <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <p className="max-w-[58ch] text-pretty italic">{meta.porQue}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-9 shrink-0"
            onClick={() => alternarEstadoMeta(meta.id)}
          >
            {meta.estado === 'activa' ? 'Pausar' : 'Reactivar'}
          </Button>
        </div>

        {/* Instrumentos */}
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <dt className="label-instrumento text-muted-foreground">Avance</dt>
            <dd className="tnum mt-1 text-sm font-medium">
              {progreso.hechas}/{progreso.tareas} tareas
            </dd>
          </div>
          <div>
            <dt className="label-instrumento text-muted-foreground">Invertido</dt>
            <dd className="tnum mt-1 text-sm font-medium">
              {formatoMin(progreso.minutosInvertidos)}
            </dd>
          </div>
          <div>
            <dt className="label-instrumento text-muted-foreground">Horizonte</dt>
            <dd className="mt-1 text-sm font-medium first-letter:uppercase">
              {fechaLegible(meta.horizonte)}
            </dd>
          </div>
        </dl>

        <div
          className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`${progreso.pct}% de las tareas hechas`}
        >
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-500"
            style={{ width: `${progreso.pct}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="hover:bg-accent/50 focus-visible:ring-ring flex w-full items-center justify-between gap-2 border-t px-[var(--pad-card)] py-2.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground">
          {progreso.objetivos} {progreso.objetivos === 1 ? 'objetivo' : 'objetivos'}
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 transition-transform',
            abierto && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {abierto && (
        <div className="bg-muted/30 space-y-4 border-t px-[var(--pad-card)] py-4">
          {objetivos.map(({ objetivo, tareas }) => (
            <section key={objetivo.id}>
              <div className="border-primary/40 border-l-2 pl-3">
                <h4 className="text-sm font-medium">{objetivo.titulo}</h4>
                <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">
                  Listo cuando: {objetivo.criterioExito}
                </p>
              </div>

              <ul className="mt-2 space-y-1 pl-3">
                {tareas.map((tarea) => (
                  <li key={tarea.id}>
                    <label className="hover:bg-accent/60 flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors">
                      <input
                        type="checkbox"
                        checked={tarea.estado === 'hecha'}
                        onChange={() => alternarTarea(tarea.id)}
                        className="accent-primary size-4 shrink-0"
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 text-[13px]',
                          tarea.estado === 'hecha' &&
                            'text-muted-foreground line-through',
                        )}
                      >
                        {tarea.titulo}
                      </span>
                      <span className="tnum text-muted-foreground shrink-0 text-[11px]">
                        {formatoMin(estimacionEfectiva(tarea))}
                        {tarea.ajusteAceptadoMin !== 0 && (
                          <span className="text-foreground/60">
                            {' '}
                            ({tarea.ajusteAceptadoMin > 0 ? '+' : ''}
                            {tarea.ajusteAceptadoMin})
                          </span>
                        )}
                      </span>
                      <EtiquetaEstadoTarea estado={tarea.estado} />
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </article>
  )
}
