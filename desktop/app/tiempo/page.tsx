'use client'

import { useMemo, useRef, useState } from 'react'
import { Download, HardDrive, RotateCcw, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { formatoMin } from '@/lib/flexgoal/engine'
import { DIAS_LARGOS } from '@/lib/flexgoal/types'
import { Encabezado } from '@/components/encabezado'
import { useConfirmacion } from '@/lib/flexgoal/confirmacion'

const PASOS = [0, 15, 30, 45, 60, 90, 120, 150, 180]

export default function PaginaTiempo() {
  const { estado, actualizarDisponibilidad, actualizarHorarioDisponibilidad, reiniciar, importar } =
    useFlexgoal()
  const confirmar = useConfirmacion()
  const inputArchivo = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null)

  const dias = useMemo(
    () =>
      DIAS_LARGOS.map((nombre, dia) => {
        const d = estado.disponibilidad.find((x) => x.dia === dia)
        return {
          dia,
          nombre,
          minutos: d?.minutos ?? 0,
          declarada: d?.declarada ?? false,
          horaInicio: d?.horaInicio ?? '',
          horaFin: d?.horaFin ?? '',
        }
      }),
    [estado.disponibilidad],
  )

  const totalSemana = dias
    .filter((d) => d.declarada)
    .reduce((a, d) => a + d.minutos, 0)
  const sinDeclarar = dias.filter((d) => !d.declarada).length

  const exportar = () => {
    const blob = new Blob([JSON.stringify(estado, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flexgoal-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setAviso({ ok: true, texto: 'Copia descargada a tu dispositivo.' })
  }

  const alImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    const ok = await confirmar({
      titulo: `¿Importar "${archivo.name}"?`,
      descripcion:
        'Va a reemplazar TODOS los datos que tenés ahora en flexgoal (ideas, metas, tareas, sesiones, disponibilidad) por lo que traiga ese archivo. No hay forma de deshacerlo después. Si querías guardar lo actual, cancelá y usá "Exportar copia" primero.',
      textoConfirmar: 'Sí, importar y reemplazar',
      destructivo: true,
    })
    if (!ok) {
      e.target.value = ''
      return
    }
    const texto = await archivo.text()
    const res = importar(texto)
    setAviso(
      res.ok
        ? { ok: true, texto: 'Datos restaurados desde el archivo.' }
        : { ok: false, texto: res.error ?? 'No pudimos importar el archivo.' },
    )
    e.target.value = ''
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo="Disponibilidad y datos"
        titulo="Tiempo"
        detalle="Declarar tu tiempo es opcional. Solo sirve para saber si un plan entra o no; si no lo declarás, no calculamos sobrecarga."
      />

      <div className="mt-6 space-y-8">
        {/* Resumen */}
        <div className="bg-card flex flex-wrap items-end justify-between gap-4 rounded-xl border pad-card">
          <div>
            <p className="label-instrumento text-muted-foreground">
              Declarado por semana
            </p>
            <p className="tnum mt-2 text-3xl font-semibold tracking-tight">
              {formatoMin(totalSemana)}
            </p>
          </div>
          {sinDeclarar > 0 && (
            <p className="text-muted-foreground max-w-[32ch] text-[13px] leading-relaxed">
              {sinDeclarar} {sinDeclarar === 1 ? 'día' : 'días'} sin declarar. Ahí la
              app planifica igual, pero no opina sobre tu carga.
            </p>
          )}
        </div>

        {/* Disponibilidad por día */}
        <section aria-labelledby="titulo-dias" className="space-y-3">
          <h2 id="titulo-dias" className="label-instrumento text-muted-foreground">
            Por día
          </h2>

          <ul className="space-y-2">
            {dias.map(({ dia, nombre, minutos, declarada, horaInicio, horaFin }) => (
              <li
                key={dia}
                className={cn(
                  'bg-card rounded-lg border pad-card',
                  !declarada && 'border-dashed bg-transparent',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={declarada}
                        onChange={(e) =>
                          actualizarDisponibilidad(
                            dia,
                            e.target.checked ? minutos || 60 : minutos,
                            e.target.checked,
                          )
                        }
                        className="accent-primary size-4"
                      />
                      <span className="text-[15px] font-medium">{nombre}</span>
                    </label>
                  </div>

                  <span
                    className={cn(
                      'tnum text-sm',
                      declarada ? 'font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {declarada ? formatoMin(minutos) : 'Sin declarar'}
                  </span>
                </div>

                {declarada && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {PASOS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => actualizarDisponibilidad(dia, p, true)}
                          aria-pressed={minutos === p}
                          className={cn(
                            'tnum focus-visible:ring-ring min-h-9 rounded-md border px-2.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                            minutos === p
                              ? 'border-primary bg-primary text-primary-foreground font-medium'
                              : 'text-muted-foreground hover:bg-accent',
                          )}
                        >
                          {p === 0 ? '0' : formatoMin(p)}
                        </button>
                      ))}
                    </div>
                    <ControlPersonalizado
                      dia={dia}
                      minutosActuales={minutos}
                      esPersonalizado={!PASOS.includes(minutos)}
                      onAplicar={(valor) => actualizarDisponibilidad(dia, valor, true)}
                    />
                    <ControlHorario
                      dia={dia}
                      horaInicio={horaInicio}
                      horaFin={horaFin}
                      onCambiar={(inicio, fin) =>
                        actualizarHorarioDisponibilidad(dia, inicio || null, fin || null)
                      }
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Local-first */}
        <section aria-labelledby="titulo-datos" className="space-y-3">
          <h2 id="titulo-datos" className="label-instrumento text-muted-foreground">
            Tus datos
          </h2>

          <div className="bg-card space-y-4 rounded-xl border pad-card">
            <div className="flex gap-3">
              <HardDrive
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <p className="text-muted-foreground max-w-[62ch] text-[13px] leading-relaxed">
                flexgoal no tiene servidor ni cuenta. Todo lo que escribís vive en el
                almacenamiento de este navegador. Si querés llevarlo a otro
                dispositivo, exportás un archivo y lo importás allá: ese es el único
                traslado que existe.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-9" onClick={exportar}>
                <Download className="size-4" aria-hidden />
                Exportar copia
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9"
                onClick={() => inputArchivo.current?.click()}
              >
                <Upload className="size-4" aria-hidden />
                Importar archivo
              </Button>
              <input
                ref={inputArchivo}
                type="file"
                accept="application/json"
                onChange={alImportar}
                className="sr-only"
                aria-label="Importar archivo de flexgoal"
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground h-9"
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: '¿Restaurar los datos de ejemplo?',
                    descripcion:
                      'Esto borra TODO lo que cargaste en flexgoal (ideas, metas, objetivos, tareas, sesiones, disponibilidad) y lo reemplaza por los datos de ejemplo. No se puede deshacer. Si querés conservar lo que tenés, cancelá esto y usá "Exportar copia" primero.',
                    textoConfirmar: 'Sí, reiniciar',
                    destructivo: true,
                  })
                  if (!ok) return
                  reiniciar()
                  setAviso({ ok: true, texto: 'Volvimos a los datos de ejemplo.' })
                }}
              >
                <RotateCcw className="size-4" aria-hidden />
                Restaurar ejemplo
              </Button>
            </div>

            {aviso && (
              <p
                role="status"
                className={cn(
                  'rounded-md border px-3 py-2 text-[13px]',
                  aviso.ok
                    ? 'border-primary/30 bg-signal-soft'
                    : 'border-signal-attention/40 bg-signal-attention-soft',
                )}
              >
                {aviso.texto}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function ControlPersonalizado({
  dia,
  minutosActuales,
  esPersonalizado,
  onAplicar,
}: {
  dia: number
  minutosActuales: number
  esPersonalizado: boolean
  onAplicar: (minutos: number) => void
}) {
  const [horas, setHoras] = useState('')
  const [minutos, setMinutos] = useState('')

  const aplicar = () => {
    const h = Number(horas) || 0
    const m = Number(minutos) || 0
    const total = h * 60 + m
    if (total <= 0) return
    onAplicar(total)
    setHoras('')
    setMinutos('')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground text-[11.5px]">Personalizado:</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="hs"
        value={horas}
        onChange={(e) => setHoras(e.target.value)}
        className="tnum focus-visible:ring-ring h-8 w-14 rounded-md border bg-transparent px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Horas personalizadas, día ${dia}`}
      />
      <input
        type="number"
        min={0}
        max={59}
        inputMode="numeric"
        placeholder="min"
        value={minutos}
        onChange={(e) => setMinutos(e.target.value)}
        className="tnum focus-visible:ring-ring h-8 w-16 rounded-md border bg-transparent px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Minutos personalizados, día ${dia}`}
      />
      <button
        type="button"
        onClick={aplicar}
        disabled={!horas && !minutos}
        className="focus-visible:ring-ring h-8 rounded-md border px-2.5 text-[12px] transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
      >
        Aplicar
      </button>
      {esPersonalizado && (
        <span className="text-primary text-[11px]">
          Actual: {formatoMin(minutosActuales)} (personalizado)
        </span>
      )}
    </div>
  )
}

function ControlHorario({
  dia,
  horaInicio,
  horaFin,
  onCambiar,
}: {
  dia: number
  horaInicio: string
  horaFin: string
  onCambiar: (inicio: string, fin: string) => void
}) {
  const [inicio, setInicio] = useState(horaInicio)
  const [fin, setFin] = useState(horaFin)

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
      <span className="text-muted-foreground text-[11.5px]">¿A qué hora? (opcional):</span>
      <input
        type="time"
        value={inicio}
        onChange={(e) => setInicio(e.target.value)}
        onBlur={() => onCambiar(inicio, fin)}
        className="tnum focus-visible:ring-ring h-8 rounded-md border bg-transparent px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Hora de inicio, día ${dia}`}
      />
      <span className="text-muted-foreground text-[12px]">a</span>
      <input
        type="time"
        value={fin}
        onChange={(e) => setFin(e.target.value)}
        onBlur={() => onCambiar(inicio, fin)}
        className="tnum focus-visible:ring-ring h-8 rounded-md border bg-transparent px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
        aria-label={`Hora de fin, día ${dia}`}
      />
      {(inicio || fin) && (
        <button
          type="button"
          onClick={() => {
            setInicio('')
            setFin('')
            onCambiar('', '')
          }}
          className="text-muted-foreground hover:text-foreground text-[11.5px] underline underline-offset-2"
        >
          Quitar horario
        </button>
      )}
      <span className="text-muted-foreground w-full text-[11px] leading-relaxed">
        Es solo para que sepas en qué franja mirar ese día — la carga se sigue
        calculando por minutos totales, no cambia nada del cálculo.
      </span>
    </div>
  )
}
