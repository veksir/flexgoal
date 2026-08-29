'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export const ACENTOS = [
  { id: 'salvia', nombre: 'Salvia', muestra: 'oklch(0.505 0.075 183)' },
  { id: 'indigo', nombre: 'Índigo', muestra: 'oklch(0.472 0.145 271)' },
  { id: 'arcilla', nombre: 'Arcilla', muestra: 'oklch(0.545 0.12 38)' },
  { id: 'ciruela', nombre: 'Ciruela', muestra: 'oklch(0.47 0.12 340)' },
  { id: 'grafito', nombre: 'Grafito', muestra: 'oklch(0.29 0.013 262)' },
] as const

export const DENSIDADES = [
  { id: 'compacta', nombre: 'Compacta' },
  { id: 'media', nombre: 'Media' },
  { id: 'amplia', nombre: 'Amplia' },
] as const

export const RADIOS = [
  { id: 'recto', nombre: 'Recto' },
  { id: 'suave', nombre: 'Suave' },
  { id: 'redondo', nombre: 'Redondo' },
] as const

export const MODOS = [
  { id: 'claro', nombre: 'Claro' },
  { id: 'oscuro', nombre: 'Oscuro' },
  { id: 'sistema', nombre: 'Sistema' },
] as const

export type Acento = (typeof ACENTOS)[number]['id']
export type Densidad = (typeof DENSIDADES)[number]['id']
export type Radio = (typeof RADIOS)[number]['id']
export type Modo = (typeof MODOS)[number]['id']

export interface Tema {
  acento: Acento
  densidad: Densidad
  radio: Radio
  modo: Modo
}

export const TEMA_POR_DEFECTO: Tema = {
  acento: 'salvia',
  densidad: 'media',
  radio: 'suave',
  modo: 'claro',
}

export const CLAVE_TEMA = 'flexgoal:tema:v1'

const Ctx = createContext<{
  tema: Tema
  setTema: (parcial: Partial<Tema>) => void
  reiniciarTema: () => void
} | null>(null)

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  raiz.dataset.accent = tema.acento
  raiz.dataset.density = tema.densidad
  raiz.dataset.radius = tema.radio
  const oscuro =
    tema.modo === 'oscuro' ||
    (tema.modo === 'sistema' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  raiz.classList.toggle('dark', oscuro)
}

export function ProveedorTema({ children }: { children: ReactNode }) {
  const [tema, setEstado] = useState<Tema>(TEMA_POR_DEFECTO)

  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(CLAVE_TEMA)
      if (crudo) {
        const parseado = { ...TEMA_POR_DEFECTO, ...JSON.parse(crudo) } as Tema
        setEstado(parseado)
        aplicarTema(parseado)
        return
      }
    } catch {
      /* tema por defecto */
    }
    aplicarTema(TEMA_POR_DEFECTO)
  }, [])

  const setTema = useCallback((parcial: Partial<Tema>) => {
    setEstado((prev) => {
      const siguiente = { ...prev, ...parcial }
      aplicarTema(siguiente)
      try {
        window.localStorage.setItem(CLAVE_TEMA, JSON.stringify(siguiente))
      } catch {
        /* sin persistencia, sigue funcionando en memoria */
      }
      return siguiente
    })
  }, [])

  const reiniciarTema = useCallback(() => {
    setEstado(TEMA_POR_DEFECTO)
    aplicarTema(TEMA_POR_DEFECTO)
    try {
      window.localStorage.removeItem(CLAVE_TEMA)
    } catch {
      /* nada */
    }
  }, [])

  return (
    <Ctx.Provider value={{ tema, setTema, reiniciarTema }}>{children}</Ctx.Provider>
  )
}

export function useTema() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTema debe usarse dentro de ProveedorTema')
  return ctx
}
