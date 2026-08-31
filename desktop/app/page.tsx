'use client'

import { useMemo, useState } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFlexgoal } from '@/lib/flexgoal/store'
import {
  calcularCarga,
  contextoDeSesion,
  fechaLegible,
  formatoMin,
  hoyISO,
  indiceDia,
  minutosPlanificados,
  minutosRegistrados,
  sesionesDelDia,
  sugerirAjustes,
  sumarDias,
} from '@/lib/flexgoal/engine'
import { MedidorCapacidad } from '@/components/medidor-capacidad'
import { PanelSugerencias } from '@/components/panel-sugerencias'
import { FilaSesion } from '@/components/fila-sesion'
import { EstadoVacio } from '@/components/estado-vacio'
import { Encabezado } from '@/components/encabezado'

export default function PaginaHoy() {
  const { estado, listo } = useFlexgoal()
  const hoy = hoyISO()
  const [archivoAbierto, setArchivoAbierto] = useState(false)

  const { sesiones, carga, sugerencias, pendientes, cerradas, disponibilidadHoy } = useMemo(() => {
    const delDia = sesionesDelDia(estado, hoy)
    const contextos = delDia
      .map((s) => contextoDeSesion(estado, s))
      .filter((c): c is NonNullable<typeof c> => c !== null)

    const disponibilidad = estado.disponibilidad.find(
      (d) => d.dia === indiceDia(hoy),
    )

    return {
      sesiones: contextos,
      carga: calcularCarga(minutosPlanificados(delDia), disponibilidad),
      sugerencias: sugerirAjustes(estado),
      pendientes: contextos.filter((c) => c.sesion.estado === 'planificada'),
      cerradas: contextos.filter((c) => c.sesion.estado !== 'planificada'),
      disponibilidadHoy: disponibilidad,
    }
  }, [estado, hoy])

  const registrado = minutosRegistrados(sesiones.map((c) => c.sesion))

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo={fechaLegible(hoy)}
        titulo="Hoy"
        detalle={
          listo
            ? `${pendientes.length} ${
                pendientes.length === 1 ? 'sesión' : 'sesiones'
              } por delante · ${formatoMin(registrado)} registrados`
            : 'Leyendo tus datos de este dispositivo…'
        }
      />

      <div className="mt-6 space-y-6">
        <MedidorCapacidad
          carga={carga}
          horario={
            disponibilidadHoy?.horaInicio && disponibilidadHoy?.horaFin
              ? { inicio: disponibilidadHoy.horaInicio, fin: disponibilidadHoy.horaFin }
              : undefined
          }
          segmentos={sesiones
            .filter((c) => c.sesion.estado !== 'omitida')
            .map((c) => ({
              id: c.sesion.id,
              etiqueta: c.tarea.titulo,
              minutos: c.sesion.minutosPlan,
            }))}
        />

        <PanelSugerencias sugerencias={sugerencias} />

        <section aria-labelledby="titulo-pendientes" className="space-y-3">
          <h2
            id="titulo-pendientes"
            className="border-b pb-2 text-[15px] font-semibold"
          >
            Por hacer
          </h2>

          {pendientes.length === 0 ? (
            <EstadoVacio
              Icono={CalendarPlus}
              titulo="No hay sesiones planificadas para hoy"
              detalle="Un día sin plan también es un dato válido. Podés armar el día desde la vista de Semana."
              accion={{ href: '/semana', texto: 'Ir a Semana' }}
            />
          ) : (
            <ul className="space-y-2">
              {pendientes.map((ctx) => (
                <FilaSesion
                  key={ctx.sesion.id}
                  ctx={ctx}
                  siguienteFecha={sumarDias(hoy, 1)}
                />
              ))}
            </ul>
          )}
        </section>

        {cerradas.length > 0 && (
          <section aria-labelledby="titulo-cerradas" className="space-y-3">
            <button
              type="button"
              onClick={() => setArchivoAbierto((v) => !v)}
              aria-expanded={archivoAbierto}
              className="hover:bg-accent/40 -mx-2 flex w-full items-center justify-between gap-3 rounded-lg border-b px-2 pb-2 transition-colors"
            >
              <span id="titulo-cerradas" className="text-[15px] font-semibold">
                Ya registrado <span className="text-muted-foreground tnum font-normal">({cerradas.length})</span>
              </span>
              <ChevronDown
                className={cn('text-muted-foreground size-4 transition-transform', archivoAbierto && 'rotate-180')}
                aria-hidden
              />
            </button>
            {archivoAbierto && (
              <ul className="space-y-2">
                {cerradas.map((ctx) => (
                  <FilaSesion
                    key={ctx.sesion.id}
                    ctx={ctx}
                    siguienteFecha={sumarDias(hoy, 1)}
                  />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
