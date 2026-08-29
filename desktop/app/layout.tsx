import type { Metadata, Viewport } from 'next'
import { CLAVE_TEMA, TEMA_POR_DEFECTO, ProveedorTema } from '@/lib/flexgoal/tema'
import { ProveedorFlexgoal } from '@/lib/flexgoal/store'
import { ProveedorCronometro } from '@/lib/flexgoal/cronometro'
import { Shell } from '@/components/shell'
import './globals.css'

// Sin next/font/google: esta app corre empaquetada en Electron, sin
// conexión garantizada, y el compromiso del producto es "local-first,
// sin red" — no tiene sentido que compilar (ni menos, que abrir la
// app) dependa de bajar tipografías de Google. globals.css ya define
// --font-geist-sans/--font-geist-mono con fallback a fuentes del
// sistema (ui-sans-serif, ui-monospace); alcanza con no pisarlas.

export const metadata: Metadata = {
  title: 'flexgoal — planificador adaptativo local-first',
  description:
    'Convierte ideas en metas, objetivos y tareas con estimaciones que se ajustan a tu tiempo real. Todo queda guardado en tu dispositivo.',
  applicationName: 'flexgoal',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f8' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1e23' },
  ],
  userScalable: true,
}

const scriptTema = `(function(){try{var d=document.documentElement;var t=${JSON.stringify(
  TEMA_POR_DEFECTO,
)};var s=localStorage.getItem(${JSON.stringify(
  CLAVE_TEMA,
)});if(s){t=Object.assign(t,JSON.parse(s));}
d.dataset.accent=t.acento;d.dataset.density=t.densidad;d.dataset.radius=t.radio;
var o=t.modo==='oscuro'||(t.modo==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
d.classList.toggle('dark',o);}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      data-accent="salvia"
      data-density="media"
      data-radius="suave"
      className="bg-background"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <ProveedorTema>
          <ProveedorFlexgoal>
            <ProveedorCronometro>
              <Shell>{children}</Shell>
            </ProveedorCronometro>
          </ProveedorFlexgoal>
        </ProveedorTema>
      </body>
    </html>
  )
}
