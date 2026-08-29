'use client'

import { useMemo, useState } from 'react'
import { useFlexgoal } from '@/lib/flexgoal/store'
import {
  calcularCarga,
  contextoDeSesion,
  formatoMin,
  hoyISO,
  indiceDia,
  inicioDeSemana,
  minutosPlanificados,
  semanaDe,
  sumarDias,
} from '@/lib/flexgoal/engine'
import { DIAS } from '@/lib/flexgoal/types'
import { Encabezado } from '@/components/encabezado'
import { Button } from '@/components/ui/button'
import { ColumnaDia } from '@/components/columna-dia'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginaSemana() {
  const { estado } = useFlexgoal()
  const hoy = hoyISO()
  const [ancla, setAncla] = useState(() => inicioDeSemana(hoy))

  const dias = useMemo(() => {
    return semanaDe(ancla).map((fecha) => {
      const sesiones = estado.sesiones
        .filter((s) => s.fecha === fecha)
        .map((s) => contextoDeSesion(estado, s))
        .filter((c): c is NonNullable<typeof c> => c !== null)

      const disponibilidad = estado.disponibilidad.find(
        (d) => d.dia === indiceDia(fecha),
      )

      return {
        fecha,
        etiqueta: DIAS[indiceDia(fecha)],
        numero: Number(fecha.slice(-2)),
        esHoy: fecha === hoy,
        sesiones,
        carga: calcularCarga(
          minutosPlanificados(sesiones.map((c) => c.sesion)),
          disponibilidad,
        ),
      }
    })
  }, [estado, ancla, hoy])

  const totalPlan = dias.reduce((a, d) => a + d.carga.minutosPlan, 0)
  const totalDeclarado = dias.reduce((a, d) => a + d.carga.minutosDisponibles, 0)
  const diasSinDatos = dias.filter((d) => !d.carga.declarada).length
  const rango = `${dias[0].fecha.slice(8)}–${dias[6].fecha.slice(8)} · ${new Date(
    Number(ancla.slice(0, 4)),
    Number(ancla.slice(5, 7)) - 1,
  ).toLocaleDateString('es', { month: 'long', year: 'numeric' })}`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo={rango}
        titulo="Semana"
        detalle={`${formatoMin(totalPlan)} planificados sobre ${formatoMin(
          totalDeclarado,
        )} declarados.${
          diasSinDatos > 0
            ? ` ${diasSinDatos} ${diasSinDatos === 1 ? 'día' : 'días'} sin tiempo declarado: ahí no calculamos sobrecarga.`
            : ''
        }`}
        acciones={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Semana anterior"
              onClick={() => setAncla((a) => sumarDias(a, -7))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setAncla(inicioDeSemana(hoy))}
            >
              Esta semana
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-9"
              aria-label="Semana siguiente"
              onClick={() => setAncla((a) => sumarDias(a, 7))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {dias.map((dia) => (
          <ColumnaDia key={dia.fecha} {...dia} />
        ))}
      </div>
    </div>
  )
}
