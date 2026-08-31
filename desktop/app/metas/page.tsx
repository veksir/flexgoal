'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { progresoMeta } from '@/lib/flexgoal/engine'
import { Encabezado } from '@/components/encabezado'
import { TarjetaMeta } from '@/components/tarjeta-meta'
import { EstadoVacio } from '@/components/estado-vacio'
import type { EstadoMeta } from '@/lib/flexgoal/types'

export default function PaginaMetas() {
  const { estado } = useFlexgoal()

  const metas = useMemo(
    () =>
      estado.metas.map((meta) => {
        const objetivos = estado.objetivos
          .filter((o) => o.metaId === meta.id)
          .sort((a, b) => a.orden - b.orden)
          .map((objetivo) => ({
            objetivo,
            tareas: estado.tareas.filter((t) => t.objetivoId === objetivo.id),
          }))
        return { meta, objetivos, progreso: progresoMeta(estado, meta.id) }
      }),
    [estado],
  )

  const porEstado = (e: EstadoMeta) => metas.filter((m) => m.meta.estado === e)
  const activas = porEstado('activa')
  const pausadas = porEstado('pausada')
  const completadas = porEstado('completada')
  const archivadas = porEstado('archivada')

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo="Idea → Meta → Objetivo → Tarea"
        titulo="Metas"
        detalle="Cada meta guarda por qué importa. Es lo que se lee cuando la motivación no alcanza."
      />

      <div className="mt-6 space-y-9">
        {metas.length === 0 ? (
          <EstadoVacio
            Icono={Target}
            titulo="Todavía no hay metas"
            detalle="Las metas nacen de ideas. Anotá primero, decidí después."
            accion={{ href: '/ideas', texto: 'Ir a Ideas' }}
          />
        ) : (
          <>
            <SeccionMetas titulo="En curso" cantidad={activas.length} items={activas} abiertaPorDefecto />

            <SeccionMetas
              titulo="Pausadas"
              cantidad={pausadas.length}
              items={pausadas}
              abiertaPorDefecto
              nota="Pausar no es abandonar. Una meta pausada no cuenta para tu carga ni aparece en el plan."
            />

            <SeccionMetas
              titulo="Completadas"
              cantidad={completadas.length}
              items={completadas}
              abiertaPorDefecto={false}
            />

            <SeccionMetas
              titulo="Archivadas"
              cantidad={archivadas.length}
              items={archivadas}
              abiertaPorDefecto={false}
              nota="Archivar no borra nada — se puede restaurar en cualquier momento desde acá."
            />
          </>
        )}
      </div>
    </div>
  )
}


function SeccionMetas({
  titulo,
  cantidad,
  items,
  abiertaPorDefecto,
  nota,
}: {
  titulo: string
  cantidad: number
  items: Array<{
    meta: import('@/lib/flexgoal/types').Meta
    objetivos: {
      objetivo: import('@/lib/flexgoal/types').Objetivo
      tareas: import('@/lib/flexgoal/types').Tarea[]
    }[]
    progreso: ReturnType<typeof progresoMeta>
  }>
  abiertaPorDefecto: boolean
  nota?: string
}) {
  const [abierta, setAbierta] = useState(abiertaPorDefecto)

  if (cantidad === 0) return null

  return (
    <section className="space-y-3">
      {/* Encabezado de sección con más peso visual que un simple
          label chico — reportaste que con las mayúsculas pequeñas era
          fácil no notar el cambio de sección al scrollear rápido. */}
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="hover:bg-accent/40 -mx-2 flex w-full items-center justify-between gap-3 rounded-lg border-b px-2 pb-2.5 transition-colors"
      >
        <span className="flex items-baseline gap-2">
          <h2 className="text-[15px] font-semibold">{titulo}</h2>
          <span className="text-muted-foreground tnum text-[13px]">{cantidad}</span>
        </span>
        <ChevronDown
          className={cn('text-muted-foreground size-4 shrink-0 transition-transform', abierta && 'rotate-180')}
          aria-hidden
        />
      </button>

      {abierta && (
        <>
          {nota && (
            <p className="text-muted-foreground max-w-[60ch] text-[13px] leading-relaxed">{nota}</p>
          )}
          <div className="space-y-3">
            {items.map((m) => (
              <TarjetaMeta key={m.meta.id} {...m} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
