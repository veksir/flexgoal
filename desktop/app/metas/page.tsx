'use client'

import { useMemo } from 'react'
import { Target } from 'lucide-react'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { progresoMeta } from '@/lib/flexgoal/engine'
import { Encabezado } from '@/components/encabezado'
import { TarjetaMeta } from '@/components/tarjeta-meta'
import { EstadoVacio } from '@/components/estado-vacio'

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

  const activas = metas.filter((m) => m.meta.estado === 'activa')
  const otras = metas.filter((m) => m.meta.estado !== 'activa')

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo="Idea → Meta → Objetivo → Tarea"
        titulo="Metas"
        detalle="Cada meta guarda por qué importa. Es lo que se lee cuando la motivación no alcanza."
      />

      <div className="mt-6 space-y-8">
        {activas.length === 0 && otras.length === 0 ? (
          <EstadoVacio
            Icono={Target}
            titulo="Todavía no hay metas"
            detalle="Las metas nacen de ideas. Anotá primero, decidí después."
            accion={{ href: '/ideas', texto: 'Ir a Ideas' }}
          />
        ) : (
          <>
            <section aria-labelledby="metas-activas" className="space-y-3">
              <h2
                id="metas-activas"
                className="label-instrumento text-muted-foreground"
              >
                En curso · {activas.length}
              </h2>
              <div className="space-y-3">
                {activas.map((m) => (
                  <TarjetaMeta key={m.meta.id} {...m} />
                ))}
              </div>
            </section>

            {otras.length > 0 && (
              <section aria-labelledby="metas-pausadas" className="space-y-3">
                <h2
                  id="metas-pausadas"
                  className="label-instrumento text-muted-foreground"
                >
                  Pausadas · {otras.length}
                </h2>
                <p className="text-muted-foreground max-w-[60ch] text-[13px] leading-relaxed">
                  Pausar no es abandonar. Una meta pausada no cuenta para tu carga
                  ni aparece en el plan.
                </p>
                <div className="space-y-3">
                  {otras.map((m) => (
                    <TarjetaMeta key={m.meta.id} {...m} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
