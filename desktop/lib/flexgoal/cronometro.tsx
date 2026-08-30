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
  estiloReloj: EstiloReloj
  setEstiloReloj: (estilo: EstiloReloj) => void
  sonidoActivo: boolean
  setSonidoActivo: (activo: boolean) => void
  iniciar: (sesionId: string, tareaId: string, modo: ModoSesion) => void
  pausar: () => void
  reanudar: () => void
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
    if (!activa || activa.pausada) {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
      return
    }

    intervaloRef.current = setInterval(() => {
      setActiva((prev) => {
        if (!prev || prev.pausada) return prev
        const segundosFaseActual = prev.segundosFaseActual + 1
        const segundosTrabajo =
          prev.fase === 'trabajo' ? prev.segundosTrabajo + 1 : prev.segundosTrabajo

        if (prev.modo === 'pomodoro') {
          const limiteSeg =
            (prev.fase === 'trabajo' ? configPomodoro.trabajoMin : configPomodoro.descansoMin) * 60
          if (segundosFaseActual >= limiteSeg) {
            const nuevaFase = prev.fase === 'trabajo' ? 'descanso' : 'trabajo'
            if (sonidoActivoRef.current) reproducirTonoCambioFase(nuevaFase)
            return {
              ...prev,
              fase: nuevaFase,
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
  }, [Boolean(activa), activa?.pausada, configPomodoro.trabajoMin, configPomodoro.descansoMin])

  const iniciar = useCallback((sesionId: string, tareaId: string, modo: ModoSesion) => {
    setActiva({
      sesionId,
      tareaId,
      modo,
      fase: 'trabajo',
      pausada: false,
      segundosTrabajo: 0,
      segundosFaseActual: 0,
    })
  }, [])

  const pausar = useCallback(() => {
    setActiva((prev) => (prev ? { ...prev, pausada: true } : prev))
  }, [])

  const reanudar = useCallback(() => {
    setActiva((prev) => (prev ? { ...prev, pausada: false } : prev))
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
