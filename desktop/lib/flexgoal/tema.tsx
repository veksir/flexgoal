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

export const TIPOGRAFIAS = [
  { id: 'sans', nombre: 'Sans (por defecto)' },
  { id: 'serif', nombre: 'Serif' },
  { id: 'redondeada', nombre: 'Redondeada' },
] as const

export const TAMANOS_TEXTO = [
  { id: 'pequeno', nombre: 'Pequeño' },
  { id: 'normal', nombre: 'Normal' },
  { id: 'grande', nombre: 'Grande' },
] as const

export const ESTILOS_TARJETA = [
  { id: 'plano', nombre: 'Plano (solo borde)' },
  { id: 'sombra', nombre: 'Con sombra' },
] as const

export const ANIMACIONES = [
  { id: 'activadas', nombre: 'Activadas' },
  { id: 'reducidas', nombre: 'Reducidas' },
] as const

export type Acento = (typeof ACENTOS)[number]['id'] | 'personalizado'
export type Densidad = (typeof DENSIDADES)[number]['id']
export type Radio = (typeof RADIOS)[number]['id']
export type Modo = (typeof MODOS)[number]['id']
export type Tipografia = (typeof TIPOGRAFIAS)[number]['id']
export type TamanoTexto = (typeof TAMANOS_TEXTO)[number]['id']
export type EstiloTarjeta = (typeof ESTILOS_TARJETA)[number]['id']
export type Animaciones = (typeof ANIMACIONES)[number]['id']

export interface Tema {
  acento: Acento
  densidad: Densidad
  radio: Radio
  modo: Modo
  tipografia: Tipografia
  tamanoTexto: TamanoTexto
  tarjetas: EstiloTarjeta
  animaciones: Animaciones
  /** Hex (#rrggbb). Solo se usa cuando acento === 'personalizado'. */
  colorPersonalizado?: string
}

export const TEMA_POR_DEFECTO: Tema = {
  acento: 'salvia',
  densidad: 'media',
  radio: 'suave',
  tipografia: 'sans',
  tamanoTexto: 'normal',
  tarjetas: 'plano',
  animaciones: 'activadas',
  modo: 'claro',
}

export const CLAVE_TEMA = 'flexgoal:tema:v1'

const Ctx = createContext<{
  tema: Tema
  setTema: (parcial: Partial<Tema>) => void
  reiniciarTema: () => void
} | null>(null)

/** Negro o blanco según qué de los dos contrasta mejor contra `hex`
 * (fórmula de luminancia perceptual estándar, WCAG-ish). */
function textoLegibleSobre(hex: string): string {
  const limpio = hex.replace('#', '')
  const r = parseInt(limpio.slice(0, 2), 16) / 255
  const g = parseInt(limpio.slice(2, 4), 16) / 255
  const b = parseInt(limpio.slice(4, 6), 16) / 255
  const luminancia = 0.299 * r + 0.587 * g + 0.114 * b
  return luminancia > 0.6 ? 'oklch(0.2 0 0)' : 'oklch(0.98 0 0)'
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  raiz.dataset.accent = tema.acento
  raiz.dataset.density = tema.densidad
  raiz.dataset.radius = tema.radio
  raiz.dataset.font = tema.tipografia
  raiz.dataset.textSize = tema.tamanoTexto
  raiz.dataset.cards = tema.tarjetas
  raiz.dataset.motion = tema.animaciones
  const oscuro =
    tema.modo === 'oscuro' ||
    (tema.modo === 'sistema' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  raiz.classList.toggle('dark', oscuro)

  // Acento personalizado: no hay preset en globals.css para esto (los
  // 5 acentos de fábrica tienen valores OKLCH calibrados a mano para
  // luz y oscuridad), así que se pisan las variables directo con
  // color-mix()/contraste calculado, en vez de intentar adivinar un
  // par light/dark "bonito" para cualquier color arbitrario.
  if (tema.acento === 'personalizado' && tema.colorPersonalizado) {
    raiz.style.setProperty('--primary', tema.colorPersonalizado)
    raiz.style.setProperty('--primary-foreground', textoLegibleSobre(tema.colorPersonalizado))
    raiz.style.setProperty('--ring', tema.colorPersonalizado)
    raiz.style.setProperty(
      '--signal-soft',
      `color-mix(in oklch, ${tema.colorPersonalizado} 16%, var(--background))`,
    )
  } else {
    raiz.style.removeProperty('--primary')
    raiz.style.removeProperty('--primary-foreground')
    raiz.style.removeProperty('--ring')
    raiz.style.removeProperty('--signal-soft')
  }
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
