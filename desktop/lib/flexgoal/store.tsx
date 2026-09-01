'use client'

/**
 * Persistencia local-first.
 * Todo el estado vive en localStorage del dispositivo. No hay servidor,
 * no hay cuenta, no hay red. Exportar/importar es el único traslado.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { estadoInicial, estadoVacio } from './seed'
import type { EstadoApp, Idea, Meta, Objetivo, Sesion, Tarea } from './types'

const CLAVE = 'flexgoal:estado:v1'

interface Acciones {
  estado: EstadoApp
  listo: boolean
  registrarSesion: (id: string, minutosReal: number) => void
  /** Como registrarSesion, pero NO cierra la sesión (queda
   * 'planificada'). Para "guardo lo que llevo y sigo después" sin
   * tener que ir a buscarla al archivo de cerradas. */
  registrarProgreso: (id: string, minutosReal: number) => void
  reabrirSesion: (id: string) => void
  omitirSesion: (id: string) => void
  reprogramarSesion: (id: string, fecha: string) => void
  moverMinutos: (id: string, delta: number) => void
  agregarSesion: (tareaId: string, fecha: string, minutosPlan: number) => void
  quitarSesion: (id: string) => void
  aceptarAjuste: (tareaId: string, delta: number) => void
  descartarSugerencia: (id: string) => void
  alternarTarea: (id: string) => void
  agregarObjetivo: (metaId: string, titulo: string, criterioExito: string) => void
  agregarTarea: (objetivoId: string, titulo: string, estimacionMin: number) => void
  eliminarObjetivo: (id: string) => void
  eliminarTarea: (id: string) => void
  agregarIdea: (titulo: string, notas?: string) => void
  promoverIdea: (id: string) => void
  promoverIdeaConEstructura: (
    id: string,
    porQue: string,
    objetivos: { titulo: string; criterioExito: string; tareas: { titulo: string; estimacionMin: number }[] }[],
  ) => void
  descartarIdea: (id: string) => void
  actualizarDisponibilidad: (dia: number, minutos: number, declarada: boolean) => void
  /** Rango horario opcional (puramente informativo, ver comentario en
   * el tipo Disponibilidad). Pasar null en ambos para borrar el
   * rango sin tocar los minutos declarados. */
  actualizarHorarioDisponibilidad: (
    dia: number,
    horaInicio: string | null,
    horaFin: string | null,
  ) => void
  alternarEstadoMeta: (id: string) => void
  /** Mueve una meta a cualquiera de los 4 estados posibles — el tipo
   * de datos ya soportaba 'completada'/'archivada' desde siempre,
   * solo faltaba una acción (y una interfaz) para llegar ahí. */
  cambiarEstadoMeta: (id: string, estado: Meta['estado']) => void
  editarMeta: (id: string, cambios: Partial<Pick<Meta, 'titulo' | 'porQue' | 'horizonte'>>) => void
  reiniciar: () => void
  importar: (json: string) => { ok: boolean; error?: string }
}

const Ctx = createContext<Acciones | null>(null)

function leer(): EstadoApp {
  if (typeof window === 'undefined') return estadoVacio()
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return estadoVacio()
    const parseado = JSON.parse(crudo) as EstadoApp
    if (!parseado?.metas) return estadoVacio()
    return parseado
  } catch {
    return estadoVacio()
  }
}

export function ProveedorFlexgoal({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoApp>(() => estadoVacio())
  const [listo, setListo] = useState(false)

  useEffect(() => {
    setEstado(leer())
    setListo(true)
  }, [])

  useEffect(() => {
    if (!listo) return
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(estado))
    } catch (error) {
      console.log('[v0] no se pudo guardar en localStorage:', error)
    }
  }, [estado, listo])

  const mut = useCallback((fn: (e: EstadoApp) => EstadoApp) => {
    setEstado((prev) => fn(structuredClone(prev)))
  }, [])

  const acciones = useMemo<Acciones>(
    () => ({
      estado,
      listo,

      registrarSesion: (id, minutosReal) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (!s) return e
          s.minutosReal = minutosReal
          s.registradoEn = s.registradoEn ?? new Date().toISOString()
          s.estado =
            minutosReal === 0
              ? 'omitida'
              : minutosReal < s.minutosPlan * 0.8
                ? 'parcial'
                : 'hecha'

          // Bug reportado: marcar "Terminé" en Hoy no se reflejaba en
          // Metas (el checkbox de la tarea seguía sin tildar). Se
          // sincroniza acá — pero solo si esta era la ÚLTIMA sesión
          // pendiente de esa tarea, para no cerrar una tarea que
          // todavía tiene trabajo planificado en otro día.
          if (s.estado === 'hecha') {
            const quedanPendientes = e.sesiones.some(
              (otra) => otra.tareaId === s.tareaId && otra.id !== s.id && otra.estado === 'planificada',
            )
            if (!quedanPendientes) {
              const t = e.tareas.find((x) => x.id === s.tareaId)
              if (t) t.estado = 'hecha'
            }
          }
          return e
        }),

      registrarProgreso: (id, minutosReal) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (s) {
            s.minutosReal = minutosReal
            s.registradoEn = s.registradoEn ?? new Date().toISOString()
          }
          return e
        }),

      // Contraparte de registrarSesion/omitirSesion: nada en esta app
      // debería quedar "cerrado para siempre" sin salida — un click
      // equivocado en "Hecha" o "No fue hoy" tiene que poder
      // deshacerse. Vuelve la sesión a planificada; no borra el
      // minutosReal anterior por si el usuario solo quiere seguir
      // sumando tiempo, no empezar de cero.
      reabrirSesion: (id) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (s) {
            s.estado = 'planificada'
            const t = e.tareas.find((x) => x.id === s.tareaId)
            if (t && t.estado === 'hecha') t.estado = 'en_progreso'
          }
          return e
        }),

      omitirSesion: (id) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (s) {
            s.estado = 'omitida'
            s.minutosReal = 0
          }
          return e
        }),

      reprogramarSesion: (id, fecha) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (s) {
            s.fecha = fecha
            s.estado = 'planificada'
            s.minutosReal = null
          }
          return e
        }),

      moverMinutos: (id, delta) =>
        mut((e) => {
          const s = e.sesiones.find((x) => x.id === id)
          if (s) s.minutosPlan = Math.max(5, s.minutosPlan + delta)
          return e
        }),

      agregarSesion: (tareaId, fecha, minutosPlan) =>
        mut((e) => {
          const nueva: Sesion = {
            id: `ses-${Date.now()}`,
            tareaId,
            fecha,
            minutosPlan,
            minutosReal: null,
            estado: 'planificada',
          }
          e.sesiones.push(nueva)
          return e
        }),

      quitarSesion: (id) =>
        mut((e) => {
          e.sesiones = e.sesiones.filter((s) => s.id !== id)
          return e
        }),

      aceptarAjuste: (tareaId, delta) =>
        mut((e) => {
          const t = e.tareas.find((x) => x.id === tareaId)
          if (t) t.ajusteAceptadoMin += delta
          e.sugerenciasDescartadas.push(`${tareaId}:${delta}`)
          for (const s of e.sesiones) {
            if (s.tareaId === tareaId && s.estado === 'planificada') {
              s.minutosPlan = Math.max(5, s.minutosPlan + delta)
            }
          }
          return e
        }),

      descartarSugerencia: (id) =>
        mut((e) => {
          e.sugerenciasDescartadas.push(id)
          return e
        }),

      alternarTarea: (id) =>
        mut((e) => {
          const t = e.tareas.find((x) => x.id === id)
          if (t) t.estado = t.estado === 'hecha' ? 'en_progreso' : 'hecha'
          return e
        }),

      agregarObjetivo: (metaId, titulo, criterioExito) =>
        mut((e) => {
          const ordenSiguiente = e.objetivos.filter((o) => o.metaId === metaId).length
          e.objetivos.push({
            id: `o-${Date.now()}`,
            metaId,
            titulo,
            criterioExito,
            orden: ordenSiguiente,
          })
          return e
        }),

      agregarTarea: (objetivoId, titulo, estimacionMin) =>
        mut((e) => {
          e.tareas.push({
            id: `t-${Date.now()}`,
            objetivoId,
            titulo,
            estimacionMin: Math.max(5, estimacionMin),
            estado: 'pendiente',
            ajusteAceptadoMin: 0,
          })
          return e
        }),

      eliminarObjetivo: (id) =>
        mut((e) => {
          const tareaIds = new Set(e.tareas.filter((t) => t.objetivoId === id).map((t) => t.id))
          e.tareas = e.tareas.filter((t) => t.objetivoId !== id)
          e.sesiones = e.sesiones.filter((s) => !tareaIds.has(s.tareaId))
          e.objetivos = e.objetivos.filter((o) => o.id !== id)
          return e
        }),

      eliminarTarea: (id) =>
        mut((e) => {
          e.sesiones = e.sesiones.filter((s) => s.tareaId !== id)
          e.tareas = e.tareas.filter((t) => t.id !== id)
          return e
        }),

      agregarIdea: (titulo, notas) =>
        mut((e) => {
          const nueva: Idea = {
            id: `i-${Date.now()}`,
            titulo,
            notas,
            estado: 'inbox',
            creadaEn: new Date().toISOString().slice(0, 10),
          }
          e.ideas.unshift(nueva)
          return e
        }),

      promoverIdea: (id) =>
        mut((e) => {
          const idea = e.ideas.find((x) => x.id === id)
          if (!idea) return e
          idea.estado = 'promovida'
          const meta: Meta = {
            id: `m-${Date.now()}`,
            titulo: idea.titulo,
            porQue: idea.notas ?? 'Pendiente de escribir por qué importa.',
            horizonte: new Date(Date.now() + 90 * 86400000)
              .toISOString()
              .slice(0, 10),
            estado: 'activa',
            creadaEn: new Date().toISOString().slice(0, 10),
          }
          idea.metaId = meta.id
          e.metas.push(meta)
          return e
        }),

      promoverIdeaConEstructura: (id, porQue, objetivosPropuestos) =>
        mut((e) => {
          const idea = e.ideas.find((x) => x.id === id)
          if (!idea) return e

          idea.estado = 'promovida'
          const metaId = `m-${Date.now()}`
          const meta: Meta = {
            id: metaId,
            titulo: idea.titulo,
            porQue: porQue.trim() || 'Pendiente de escribir por qué importa.',
            horizonte: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            estado: 'activa',
            creadaEn: new Date().toISOString().slice(0, 10),
          }
          idea.metaId = metaId
          e.metas.push(meta)

          objetivosPropuestos.forEach((op, indiceObjetivo) => {
            const objetivoId = `o-${Date.now()}-${indiceObjetivo}`
            const objetivo: Objetivo = {
              id: objetivoId,
              metaId,
              titulo: op.titulo,
              criterioExito: op.criterioExito,
              orden: indiceObjetivo,
            }
            e.objetivos.push(objetivo)

            op.tareas.forEach((tp, indiceTarea) => {
              const tarea: Tarea = {
                id: `t-${Date.now()}-${indiceObjetivo}-${indiceTarea}`,
                objetivoId,
                titulo: tp.titulo,
                estimacionMin: tp.estimacionMin,
                estado: 'pendiente',
                ajusteAceptadoMin: 0,
              }
              e.tareas.push(tarea)
            })
          })

          return e
        }),

      descartarIdea: (id) =>
        mut((e) => {
          const idea = e.ideas.find((x) => x.id === id)
          if (idea) idea.estado = idea.estado === 'descartada' ? 'inbox' : 'descartada'
          return e
        }),

      actualizarDisponibilidad: (dia, minutos, declarada) =>
        mut((e) => {
          const d = e.disponibilidad.find((x) => x.dia === dia)
          if (d) {
            d.minutos = minutos
            d.declarada = declarada
          } else {
            e.disponibilidad.push({ dia, minutos, declarada })
          }
          return e
        }),

      actualizarHorarioDisponibilidad: (dia, horaInicio, horaFin) =>
        mut((e) => {
          const d = e.disponibilidad.find((x) => x.dia === dia)
          if (d) {
            d.horaInicio = horaInicio ?? undefined
            d.horaFin = horaFin ?? undefined
          } else {
            e.disponibilidad.push({
              dia,
              minutos: 0,
              declarada: false,
              horaInicio: horaInicio ?? undefined,
              horaFin: horaFin ?? undefined,
            })
          }
          return e
        }),

      alternarEstadoMeta: (id) =>
        mut((e) => {
          const m = e.metas.find((x) => x.id === id)
          if (m) m.estado = m.estado === 'activa' ? 'pausada' : 'activa'
          return e
        }),

      cambiarEstadoMeta: (id, estado) =>
        mut((e) => {
          const m = e.metas.find((x) => x.id === id)
          if (m) m.estado = estado
          return e
        }),

      editarMeta: (id, cambios) =>
        mut((e) => {
          const m = e.metas.find((x) => x.id === id)
          if (m) Object.assign(m, cambios)
          return e
        }),

      reiniciar: () => setEstado(estadoInicial()),

      importar: (json) => {
        try {
          const parseado = JSON.parse(json) as EstadoApp
          if (!parseado?.metas || !Array.isArray(parseado.metas)) {
            return { ok: false, error: 'El archivo no tiene el formato de flexgoal.' }
          }
          setEstado(parseado)
          return { ok: true }
        } catch {
          return { ok: false, error: 'No pudimos leer el archivo. Revisá que sea el JSON exportado.' }
        }
      },
    }),
    [estado, listo, mut],
  )

  return <Ctx.Provider value={acciones}>{children}</Ctx.Provider>
}

export function useFlexgoal() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useFlexgoal debe usarse dentro de ProveedorFlexgoal')
  return ctx
}

export type { Tarea }
