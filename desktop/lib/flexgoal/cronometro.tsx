'use client'

/**
 * Cronómetro de sesión en vivo (libre o Pomodoro).
 *
 * Es deliberadamente un contexto SEPARADO del store de datos
 * (store.tsx): mientras corre, es puro estado efímero de UI (no tiene
 * sentido persistirlo entre recargas de la app). Lo único que termina
 * en el store persistido es el resultado — los minutos reales, vía
 * `registrarSesion`, cuando el usuario para el cronómetro.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { reproducirTonoCambioFase } from './sonido'
import { notificarCambioFase, pedirPermisoNotificaciones } from './notificaciones'

export type ModoSesion = 'libre' | 'pomodoro'
export type FasePomodoro = 'trabajo' | 'descanso'
export type EstiloReloj = 'cronometro' | 'arena' | 'pared'

export interface ConfigPomodoro {
  trabajoMin: number
  descansoMin: number
}

const CLAVE_CONFIG_POMODORO = 'flexgoal:pomodoro:v1'
const CLAVE_ESTILO_RELOJ = 'flexgoal:estilo-reloj:v1'
const CLAVE_SONIDO = 'flexgoal:sonido-fase:v1'
const CONFIG_DEFAULT: ConfigPomodoro = { trabajoMin: 25, descansoMin: 5 }
const ESTILO_DEFAULT: EstiloReloj = 'cronometro'

interface SesionActiva {
  sesionId: string
  tareaId: string
  modo: ModoSesion
  fase: FasePomodoro
  pausada: boolean
  /** Verdadero cuando se cumplió el tiempo de la fase y se está
   * esperando que el usuario confirme el cambio (ver
   * esperandoConfirmacionFase / confirmarCambioFase). Mientras es
   * true, el cronómetro deja de avanzar — no es "aviso y sigue solo",
   * es "aviso y espera". */
  esperandoConfirmacionFase: boolean
  /** Segundos acumulados en la fase de trabajo actual — lo único que
   * termina como minutosReal al detener (los descansos no cuentan). */
  segundosTrabajo: number
  /** Segundos transcurridos en la fase actual, para mostrar el
   * cronómetro y saber cuándo cambiar de fase en modo Pomodoro. Se
   * reinicia en cada cambio de fase — a propósito, representa
   * progreso DENTRO de la fase. */
  segundosFaseActual: number
  /** Segundos desde que se inició la sesión, sin reiniciarse nunca
   * (ni al pausar, ni al cambiar de fase). Es lo que usa el reloj de
   * pared: un reloj de pared no "vuelve para atrás" cada vez que
   * cambia de fase, sigue su curso — a diferencia del cronómetro y
   * el reloj de arena, que sí representan el progreso de la fase
   * actual y por eso reinician (comportamiento correcto, distinto,
   * no un bug). */
  segundosTotales: number
}

interface ContextoCronometro {
  activa: SesionActiva | null
  configPomodoro: ConfigPomodoro
  setConfigPomodoro: (config: Partial<ConfigPomodoro>) => void
  estiloReloj: EstiloReloj
  setEstiloReloj: (estilo: EstiloReloj) => void
  sonidoActivo: boolean
  setSonidoActivo: (activo: boolean) => void
  iniciar: (sesionId: string, tareaId: string, modo: ModoSesion) => void
  pausar: () => void
  reanudar: () => void
  /** El usuario acepta pasar de la fase que se cumplió a la
   * siguiente. Antes de esto, el tiempo queda congelado en el
   * límite — no cambia de fase solo. */
  confirmarCambioFase: () => void
  detener: () => { sesionId: string; minutos: number } | null
}

const Ctx = createContext<ContextoCronometro | null>(null)

export function ProveedorCronometro({ children }: { children: ReactNode }) {
  const [activa, setActiva] = useState<SesionActiva | null>(null)
  const [configPomodoro, setConfigEstado] = useState<ConfigPomodoro>(CONFIG_DEFAULT)
  const [estiloReloj, setEstiloRelojEstado] = useState<EstiloReloj>(ESTILO_DEFAULT)
  const [sonidoActivo, setSonidoActivoEstado] = useState(true)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sonidoActivoRef = useRef(true)

  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_CONFIG_POMODORO)
      if (crudo) setConfigEstado({ ...CONFIG_DEFAULT, ...JSON.parse(crudo) })
      const estilo = window.localStorage.getItem(CLAVE_ESTILO_RELOJ)
      if (estilo === 'cronometro' || estilo === 'arena' || estilo === 'pared') {
        setEstiloRelojEstado(estilo)
      }
      const sonido = window.localStorage.getItem(CLAVE_SONIDO)
      if (sonido === '0') {
        setSonidoActivoEstado(false)
        sonidoActivoRef.current = false
      }
    } catch {
      /* config por defecto */
    }
  }, [])

  const setSonidoActivo = useCallback((activo: boolean) => {
    setSonidoActivoEstado(activo)
    sonidoActivoRef.current = activo
    try {
      window.localStorage.setItem(CLAVE_SONIDO, activo ? '1' : '0')
    } catch {
      /* sigue funcionando en memoria */
    }
  }, [])

  const setConfigPomodoro = useCallback((parcial: Partial<ConfigPomodoro>) => {
    setConfigEstado((prev) => {
      const siguiente = { ...prev, ...parcial }
      try {
        window.localStorage.setItem(CLAVE_CONFIG_POMODORO, JSON.stringify(siguiente))
      } catch {
        /* sigue funcionando en memoria */
      }
      return siguiente
    })
  }, [])

  const setEstiloReloj = useCallback((estilo: EstiloReloj) => {
    setEstiloRelojEstado(estilo)
    try {
      window.localStorage.setItem(CLAVE_ESTILO_RELOJ, estilo)
    } catch {
      /* sigue funcionando en memoria */
    }
  }, [])

  useEffect(() => {
    if (!activa || activa.pausada || activa.esperandoConfirmacionFase) {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
      return
    }

    intervaloRef.current = setInterval(() => {
      setActiva((prev) => {
        if (!prev || prev.pausada || prev.esperandoConfirmacionFase) return prev
        const segundosFaseActual = prev.segundosFaseActual + 1
        const segundosTrabajo =
          prev.fase === 'trabajo' ? prev.segundosTrabajo + 1 : prev.segundosTrabajo
        const segundosTotales = prev.segundosTotales + 1

        if (prev.modo === 'pomodoro') {
          const limiteSeg =
            (prev.fase === 'trabajo' ? configPomodoro.trabajoMin : configPomodoro.descansoMin) * 60
          if (segundosFaseActual >= limiteSeg) {
            // No cambia de fase solo: se congela en el límite y avisa
            // (sonido + notificación del sistema operativo, para que
            // se note aunque la app no esté en primer plano). El
            // cambio real de fase lo dispara confirmarCambioFase(),
            // cuando el usuario toca "Aceptar".
            if (sonidoActivoRef.current) reproducirTonoCambioFase(prev.fase === 'trabajo' ? 'descanso' : 'trabajo')
            notificarCambioFase(prev.fase)
            return {
              ...prev,
              segundosFaseActual: limiteSeg,
              segundosTrabajo,
              segundosTotales,
              esperandoConfirmacionFase: true,
            }
          }
        }

        return { ...prev, segundosFaseActual, segundosTrabajo, segundosTotales }
      })
    }, 1000)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    Boolean(activa),
    activa?.pausada,
    activa?.esperandoConfirmacionFase,
    configPomodoro.trabajoMin,
    configPomodoro.descansoMin,
  ])

  const iniciar = useCallback((sesionId: string, tareaId: string, modo: ModoSesion) => {
    pedirPermisoNotificaciones()
    setActiva({
      sesionId,
      tareaId,
      modo,
      fase: 'trabajo',
      pausada: false,
      esperandoConfirmacionFase: false,
      segundosTrabajo: 0,
      segundosFaseActual: 0,
      segundosTotales: 0,
    })
  }, [])

  const pausar = useCallback(() => {
    setActiva((prev) => (prev ? { ...prev, pausada: true } : prev))
  }, [])

  const reanudar = useCallback(() => {
    setActiva((prev) => (prev ? { ...prev, pausada: false } : prev))
  }, [])

  const confirmarCambioFase = useCallback(() => {
    setActiva((prev) =>
      prev
        ? {
            ...prev,
            fase: prev.fase === 'trabajo' ? 'descanso' : 'trabajo',
            segundosFaseActual: 0,
            esperandoConfirmacionFase: false,
          }
        : prev,
    )
  }, [])

  const detener = useCallback((): { sesionId: string; minutos: number } | null => {
    if (!activa) return null
    const minutos = Math.max(1, Math.round(activa.segundosTrabajo / 60))
    const resultado = { sesionId: activa.sesionId, minutos }
    setActiva(null)
    return resultado
  }, [activa])

  return (
    <Ctx.Provider
      value={{
        activa,
        configPomodoro,
        setConfigPomodoro,
        estiloReloj,
        setEstiloReloj,
        sonidoActivo,
        setSonidoActivo,
        iniciar,
        pausar,
        reanudar,
        confirmarCambioFase,
        detener,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useCronometro() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCronometro debe usarse dentro de ProveedorCronometro')
  return ctx
}

export function formatearCronometro(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
