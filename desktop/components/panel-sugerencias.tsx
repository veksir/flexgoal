'use client'

import { Sparkle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Sugerencia } from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'

/**
 * El motor propone; la persona decide.
 * Solo dos movimientos posibles: +15 min o -10 min. Nada se aplica solo.
 */
export function PanelSugerencias({ sugerencias }: { sugerencias: Sugerencia[] }) {
  const { aceptarAjuste, descartarSugerencia } = useFlexgoal()

  if (sugerencias.length === 0) return null

  return (
    <section aria-labelledby="titulo-sugerencias" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="titulo-sugerencias"
          className="label-instrumento text-muted-foreground"
        >
          Ajustes propuestos
        </h2>
        <p className="text-muted-foreground text-[13px]">
          Nada cambia hasta que lo aceptes.
        </p>
      </div>

      <ul className="space-y-2">
        {sugerencias.map((s) => (
          <li
            key={s.id}
            className="bg-card border-primary/25 flex flex-col gap-3 rounded-lg border pad-card sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 gap-3">
              <Sparkle
                className="text-primary mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[15px] leading-snug font-medium">
                  {s.tareaTitulo}:{' '}
                  <span className="tnum">
                    {s.deltaMin > 0 ? '+' : ''}
                    {s.deltaMin} min
                  </span>
                </p>
                <p className="text-muted-foreground mt-1 text-[13px] leading-snug">
                  {s.motivo}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                className="h-9"
                onClick={() => aceptarAjuste(s.tareaId, s.deltaMin)}
              >
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground h-9"
                onClick={() => descartarSugerencia(s.id)}
              >
                Dejar como está
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
