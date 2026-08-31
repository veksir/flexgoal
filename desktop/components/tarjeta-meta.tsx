'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, Quote, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { calcularCarga, estimacionEfectiva, fechaLegible, formatoMin, indiceDia } from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'
import type { Meta, Objetivo, Tarea } from '@/lib/flexgoal/types'
import { EtiquetaEstadoMeta, EtiquetaEstadoTarea } from '@/components/etiqueta-estado'
import { useConfirmacion } from '@/lib/flexgoal/confirmacion'

function formatearMomento(iso: string): string {
  const fecha = new Date(iso)
  const fechaTexto = fecha.toLocaleDateString('es-419', { day: 'numeric', month: 'short' })
  const horaTexto = fecha.toLocaleTimeString('es-419', { hour: '2-digit', minute: '2-digit' })
  return `${fechaTexto}, ${horaTexto}`
}

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
  const {
    estado,
    alternarTarea,
    cambiarEstadoMeta,
    editarMeta,
    agregarSesion,
    agregarObjetivo,
    agregarTarea,
  } = useFlexgoal()
  const confirmar = useConfirmacion()
  const [abierto, setAbierto] = useState(meta.estado === 'activa')
  const [editando, setEditando] = useState(false)
  const [porQueBorrador, setPorQueBorrador] = useState(meta.porQue)
  const [horizonteBorrador, setHorizonteBorrador] = useState(meta.horizonte)
  const [programandoId, setProgramandoId] = useState<string | null>(null)
  const [fechaProgramar, setFechaProgramar] = useState('')
  const [historialAbierto, setHistorialAbierto] = useState<string | null>(null)
  const [agregandoObjetivo, setAgregandoObjetivo] = useState(false)
  const [nuevoObjTitulo, setNuevoObjTitulo] = useState('')
  const [nuevoObjCriterio, setNuevoObjCriterio] = useState('')
  const [agregandoTareaEn, setAgregandoTareaEn] = useState<string | null>(null)
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState('')
  const [nuevaTareaMin, setNuevaTareaMin] = useState('30')

  function guardarEdicion() {
    editarMeta(meta.id, {
      porQue: porQueBorrador.trim() || meta.porQue,
      horizonte: horizonteBorrador || meta.horizonte,
    })
    setEditando(false)
  }

  function tieneSesion(tareaId: string) {
    return estado.sesiones.some((s) => s.tareaId === tareaId)
  }

  async function confirmarProgramacion(tarea: Tarea) {
    if (!fechaProgramar) return
    const minutosTarea = estimacionEfectiva(tarea)
    const minutosYaEseDia = estado.sesiones
      .filter((s) => s.fecha === fechaProgramar)
      .reduce((acc, s) => acc + s.minutosPlan, 0)
    const disponibilidadDestino = estado.disponibilidad.find(
      (d) => d.dia === indiceDia(fechaProgramar),
    )
    const cargaDestino = calcularCarga(minutosYaEseDia + minutosTarea, disponibilidadDestino)

    if (cargaDestino.estado === 'excedido') {
      const seguir = await confirmar({
        titulo: 'Ese día queda sobrecargado',
        descripcion: `Queda en ${formatoMin(cargaDestino.minutosPlan)} planificados sobre ${formatoMin(cargaDestino.minutosDisponibles)} disponibles — se excede por ${formatoMin(cargaDestino.minutosPlan - cargaDestino.minutosDisponibles)}.`,
        textoConfirmar: 'Agendarla igual',
      })
      if (!seguir) return
    }

    agregarSesion(tarea.id, fechaProgramar, minutosTarea)
    setProgramandoId(null)
    setFechaProgramar('')
  }

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
            {editando ? (
              <div className="mt-2.5 space-y-2">
                <textarea
                  value={porQueBorrador}
                  onChange={(e) => setPorQueBorrador(e.target.value)}
                  rows={2}
                  placeholder="¿Por qué importa esta meta?"
                  className="placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border bg-transparent px-2.5 py-2 text-[13px] leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
                />
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground text-[12px]">Horizonte</label>
                  <input
                    type="date"
                    value={horizonteBorrador}
                    onChange={(e) => setHorizonteBorrador(e.target.value)}
                    className="focus-visible:ring-ring rounded-md border bg-transparent px-2 py-1 text-[12.5px] focus-visible:ring-2 focus-visible:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8" onClick={guardarEdicion}>
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => {
                      setPorQueBorrador(meta.porQue)
                      setHorizonteBorrador(meta.horizonte)
                      setEditando(false)
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="hover:bg-accent/40 hover:border-border group mt-2.5 flex w-full items-start gap-2 rounded-md border border-transparent px-1.5 py-1 text-left transition-colors"
                aria-label="Editar por qué importa y horizonte de esta meta"
              >
                <Quote className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
                <p className="text-muted-foreground max-w-[58ch] flex-1 text-[13px] leading-relaxed text-pretty italic">
                  {meta.porQue}
                </p>
                <Pencil
                  className="text-muted-foreground/50 group-hover:text-muted-foreground mt-0.5 size-3.5 shrink-0 transition-colors"
                  aria-hidden
                />
              </button>
            )}
          </div>

          <div className="flex shrink-0 gap-1.5">
            {meta.estado === 'activa' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'completada')}
                >
                  Completar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'pausada')}
                >
                  Pausar
                </Button>
              </>
            )}
            {meta.estado === 'pausada' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'activa')}
                >
                  Reactivar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'completada')}
                >
                  Completar
                </Button>
              </>
            )}
            {meta.estado === 'completada' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'activa')}
                >
                  Reabrir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-9"
                  onClick={() => cambiarEstadoMeta(meta.id, 'archivada')}
                >
                  Archivar
                </Button>
              </>
            )}
            {meta.estado === 'archivada' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-9"
                onClick={() => cambiarEstadoMeta(meta.id, 'activa')}
              >
                Restaurar
              </Button>
            )}
          </div>
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
                    <div className="hover:bg-accent/60 flex min-h-11 flex-wrap items-center gap-3 rounded-md px-2 py-1.5 transition-colors">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
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

                      {!tieneSesion(tarea.id) &&
                        (programandoId === tarea.id ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={fechaProgramar}
                                onChange={(e) => setFechaProgramar(e.target.value)}
                                autoFocus
                                className="focus-visible:ring-ring rounded-md border bg-transparent px-2 py-1 text-[11.5px] focus-visible:ring-2 focus-visible:outline-none"
                              />
                              <Button
                                size="sm"
                                className="h-7 px-2 text-[11px]"
                                disabled={!fechaProgramar}
                                onClick={() => confirmarProgramacion(tarea)}
                              >
                                Agendar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => setProgramandoId(null)}
                                aria-label="Cancelar"
                              >
                                <X className="size-3.5" aria-hidden />
                              </Button>
                            </div>
                            {fechaProgramar &&
                              !estado.disponibilidad.find(
                                (d) => d.dia === indiceDia(fechaProgramar),
                              )?.declarada && (
                                <p className="text-amber-600 text-[11px]">
                                  Ese día no tiene tiempo declarado en Tiempo.
                                </p>
                              )}
                            {fechaProgramar &&
                              (() => {
                                const d = estado.disponibilidad.find(
                                  (x) => x.dia === indiceDia(fechaProgramar),
                                )
                                return d?.horaInicio && d?.horaFin ? (
                                  <p className="text-muted-foreground text-[11px]">
                                    Tu franja libre ese día: {d.horaInicio} a {d.horaFin}
                                  </p>
                                ) : null
                              })()}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-muted-foreground h-7 shrink-0 px-2 text-[11px]"
                            onClick={() => setProgramandoId(tarea.id)}
                          >
                            Sin programar · elegir día
                          </Button>
                        ))}
                    </div>

                    {(() => {
                      const registros = estado.sesiones
                        .filter((s) => s.tareaId === tarea.id && s.minutosReal !== null)
                        .sort((a, b) => (b.registradoEn ?? '').localeCompare(a.registradoEn ?? ''))
                      if (registros.length === 0) return null
                      const abierto = historialAbierto === tarea.id
                      return (
                        <div className="pl-2">
                          <button
                            type="button"
                            onClick={() => setHistorialAbierto(abierto ? null : tarea.id)}
                            className="text-muted-foreground hover:text-foreground text-[11px] underline underline-offset-2"
                          >
                            {abierto ? 'Ocultar historial' : `Historial (${registros.length})`}
                          </button>
                          {abierto && (
                            <ul className="text-muted-foreground mt-1 space-y-0.5 text-[11px]">
                              {registros.map((r) => (
                                <li key={r.id} className="tnum flex justify-between gap-3">
                                  <span>{r.registradoEn ? formatearMomento(r.registradoEn) : '—'}</span>
                                  <span>{formatoMin(r.minutosReal ?? 0)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })()}
                  </li>
                ))}
              </ul>

              {agregandoTareaEn === objetivo.id ? (
                <div className="mt-2 space-y-2 pl-3">
                  <input
                    type="text"
                    value={nuevaTareaTitulo}
                    onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                    placeholder="Título de la tarea"
                    autoFocus
                    className="placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-2.5 py-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      value={nuevaTareaMin}
                      onChange={(e) => setNuevaTareaMin(e.target.value)}
                      className="tnum focus-visible:ring-ring h-8 w-20 rounded-md border bg-transparent px-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
                    />
                    <span className="text-muted-foreground text-[12px]">min estimados</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={!nuevaTareaTitulo.trim()}
                      onClick={() => {
                        agregarTarea(objetivo.id, nuevaTareaTitulo.trim(), Number(nuevaTareaMin) || 30)
                        setNuevaTareaTitulo('')
                        setNuevaTareaMin('30')
                        setAgregandoTareaEn(null)
                      }}
                    >
                      Agregar tarea
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setAgregandoTareaEn(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAgregandoTareaEn(objetivo.id)}
                  className="text-muted-foreground hover:text-foreground mt-1.5 pl-3 text-[12px] underline underline-offset-2"
                >
                  + Agregar tarea
                </button>
              )}
            </section>
          ))}

          {agregandoObjetivo ? (
            <div className="space-y-2 rounded-md border p-3">
              <input
                type="text"
                value={nuevoObjTitulo}
                onChange={(e) => setNuevoObjTitulo(e.target.value)}
                placeholder="Título del objetivo"
                autoFocus
                className="placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-2.5 py-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
              />
              <input
                type="text"
                value={nuevoObjCriterio}
                onChange={(e) => setNuevoObjCriterio(e.target.value)}
                placeholder="Listo cuando… (criterio de éxito)"
                className="placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border bg-transparent px-2.5 py-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!nuevoObjTitulo.trim()}
                  onClick={() => {
                    agregarObjetivo(meta.id, nuevoObjTitulo.trim(), nuevoObjCriterio.trim())
                    setNuevoObjTitulo('')
                    setNuevoObjCriterio('')
                    setAgregandoObjetivo(false)
                  }}
                >
                  Agregar objetivo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={() => setAgregandoObjetivo(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAgregandoObjetivo(true)}
              className="text-muted-foreground hover:text-foreground text-[12.5px] underline underline-offset-2"
            >
              + Agregar objetivo
            </button>
          )}
        </div>
      )}
    </article>
  )
}
