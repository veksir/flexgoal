'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarRange,
  Clock4,
  Lightbulb,
  Palette,
  Sun,
  Moon,
  Target,
  HardDriveDownload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTema } from '@/lib/flexgoal/tema'
import { Marca } from '@/components/marca'
import { VentanaSesion } from '@/components/ventana-sesion'

const RUTAS = [
  { href: '/', etiqueta: 'Hoy', Icono: Clock4 },
  { href: '/semana', etiqueta: 'Semana', Icono: CalendarRange },
  { href: '/metas', etiqueta: 'Metas', Icono: Target },
  { href: '/ideas', etiqueta: 'Ideas', Icono: Lightbulb },
  { href: '/tiempo', etiqueta: 'Tiempo', Icono: HardDriveDownload },
  { href: '/diseno', etiqueta: 'Diseño', Icono: Palette },
] as const

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { tema, setTema } = useTema()
  const esOscuro =
    tema.modo === 'oscuro' ||
    (tema.modo === 'sistema' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  const activo = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#contenido"
        className="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral — escritorio. sticky + h-dvh: queda fija en
          pantalla sin importar cuánto scrollee el contenido principal
          (antes se estiraba junto con la página, había que volver a
          scrollear arriba para ver la navegación). */}
      <aside className="bg-card/60 sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Marca />
        </div>
        <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 p-3">
          {RUTAS.map(({ href, etiqueta, Icono }) => {
            const esActivo = activo(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={esActivo ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  esActivo
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'bg-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-opacity',
                    esActivo ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icono className="size-4 shrink-0" aria-hidden />
                {etiqueta}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-3 border-t p-3">
          <button
            type="button"
            onClick={() => setTema({ modo: esOscuro ? 'claro' : 'oscuro' })}
            className="text-muted-foreground hover:bg-accent/60 hover:text-foreground focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {esOscuro ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
            {esOscuro ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <p className="text-muted-foreground/80 px-3 text-[11px] leading-relaxed">
            Tus datos se guardan solo en este dispositivo.
          </p>
        </div>
      </aside>

      {/* Cabecera — móvil */}
      <header className="bg-background/90 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <Marca />
        <button
          type="button"
          onClick={() => setTema({ modo: esOscuro ? 'claro' : 'oscuro' })}
          aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="hover:bg-accent focus-visible:ring-ring flex size-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {esOscuro ? (
            <Sun className="size-4" aria-hidden />
          ) : (
            <Moon className="size-4" aria-hidden />
          )}
        </button>
      </header>

      <main
        id="contenido"
        className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      >
        {children}
      </main>

      {/* Navegación inferior — móvil */}
      <nav
        aria-label="Secciones"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="flex">
          {RUTAS.map(({ href, etiqueta, Icono }) => {
            const esActivo = activo(href)
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={esActivo ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px]',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                    esActivo
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'bg-primary absolute top-0 h-[2px] w-8 rounded-b-full transition-opacity',
                      esActivo ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icono className="size-[18px]" aria-hidden />
                  {etiqueta}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <VentanaSesion />
    </div>
  )
}
