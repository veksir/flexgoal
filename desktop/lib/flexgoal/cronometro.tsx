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

export type ModoSesion = 'libre' | 'pomodoro'
export type FasePomodoro = 'trabajo' | 'descanso'

export interface ConfigPomodoro {
  trabajoMin: number
  descansoMin: number
}

const CLAVE_CONFIG_POMODORO = 'flexgoal:pomodoro:v1'
const CONFIG_DEFAULT: ConfigPomodoro = { trabajoMin: 25, descansoMin: 5 }

interface SesionActiva {
  sesionId: string
  tareaId: string
  modo: ModoSesion
  fase: FasePomodoro
  /** Segundos acumulados en la fase de trabajo actual — lo único que
   * termina como minutosReal al detener (los descansos no cuentan). */
  segundosTrabajo: number
  /** Segundos transcurridos en la fase actual, para mostrar el
   * cronómetro y saber cuándo cambiar de fase en modo Pomodoro. */
  segundosFaseActual: number
}

interface ContextoCronometro {
  activa: SesionActiva | null
  configPomodoro: ConfigPomodoro
  setConfigPomodoro: (config: Partial<ConfigPomodoro>) => void
  iniciar: (sesionId: string, tareaId: string, modo: ModoSesion) => void
  detener: () => { sesionId: string; minutos: number } | null
}

const Ctx = createContext<ContextoCronometro | null>(null)

export function ProveedorCronometro({ children }: { children: ReactNode }) {
  const [activa, setActiva] = useState<SesionActiva | null>(null)
  const [configPomodoro, setConfigEstado] = useState<ConfigPomodoro>(CONFIG_DEFAULT)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_CONFIG_POMODORO)
      if (crudo) setConfigEstado({ ...CONFIG_DEFAULT, ...JSON.parse(crudo) })
    } catch {
      /* config por defecto */
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

  useEffect(() => {
    if (!activa) {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
      return
    }

    intervaloRef.current = setInterval(() => {
      setActiva((prev) => {
        if (!prev) return prev
        const segundosFaseActual = prev.segundosFaseActual + 1
        const segundosTrabajo =
          prev.fase === 'trabajo' ? prev.segundosTrabajo + 1 : prev.segundosTrabajo

        if (prev.modo === 'pomodoro') {
          const limiteSeg =
            (prev.fase === 'trabajo' ? configPomodoro.trabajoMin : configPomodoro.descansoMin) * 60
          if (segundosFaseActual >= limiteSeg) {
            return {
              ...prev,
              fase: prev.fase === 'trabajo' ? 'descanso' : 'trabajo',
              segundosFaseActual: 0,
              segundosTrabajo,
            }
          }
        }

        return { ...prev, segundosFaseActual, segundosTrabajo }
      })
    }, 1000)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(activa), configPomodoro.trabajoMin, configPomodoro.descansoMin])

  const iniciar = useCallback((sesionId: string, tareaId: string, modo: ModoSesion) => {
    setActiva({
      sesionId,
      tareaId,
      modo,
      fase: 'trabajo',
      segundosTrabajo: 0,
      segundosFaseActual: 0,
    })
  }, [])

  const detener = useCallback((): { sesionId: string; minutos: number } | null => {
    if (!activa) return null
    const minutos = Math.max(1, Math.round(activa.segundosTrabajo / 60))
    const resultado = { sesionId: activa.sesionId, minutos }
    setActiva(null)
    return resultado
  }, [activa])

  return (
    <Ctx.Provider value={{ activa, configPomodoro, setConfigPomodoro, iniciar, detener }}>
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
