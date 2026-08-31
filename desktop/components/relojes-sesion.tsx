'use client'

/**
 * Los tres estilos de reloj de la ventana de sesión enfocada.
 * Todos comparten el mismo layout: SVG arriba, número debajo (sin
 * superposición — nada de absolute compitiendo por el mismo espacio).
 *
 * Nota técnica del bug de la primera versión: en SVG el
 * transform-origin de un `transform: scale()` por defecto NO es el
 * centro del elemento (a diferencia de HTML) sino el origen del
 * viewport, salvo que se declare `transform-box: fill-box`
 * explícitamente. Por eso el hilo de arena "se escapaba" del dibujo
 * en vez de quedarse en su lugar — quedó corregido animando la
 * posición (una translación real dentro de un @keyframes propio,
 * `caer-arena`, con transform-box: fill-box) en vez de un scale.
 */

import { formatearCronometro } from '@/lib/flexgoal/cronometro'

interface PropsReloj {
  segundos: number
  /** 0–1 si hay una fase con límite (Pomodoro); null en modo libre. */
  progreso: number | null
  pausada: boolean
}

export function RelojCronometro({ segundos, progreso, pausada }: PropsReloj) {
  const circunferencia = 2 * Math.PI * 54
  const avance = progreso ?? (segundos % 60) / 60
  const offset = circunferencia * (1 - avance)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex size-32 shrink-0 items-center justify-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
          <circle cx="60" cy="60" r="54" className="stroke-muted fill-none" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="54"
            className="stroke-primary fill-none transition-[stroke-dashoffset] duration-1000 ease-linear"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={offset}
          />
        </svg>
        <span
          className="bg-primary absolute top-3 size-1.5 rounded-full"
          style={{ animation: pausada ? 'none' : 'pulso-suave 1.8s ease-in-out infinite' }}
          aria-hidden
        />
      </div>
      <span className="tnum text-3xl font-semibold tabular-nums">
        {formatearCronometro(segundos)}
      </span>
    </div>
  )
}

export function RelojArena({ segundos, progreso, pausada }: PropsReloj) {
  // En modo libre (sin fase con límite) el vidrio se "da vuelta" cada
  // 5 minutos en loop — puro efecto ambiental, no representa un
  // objetivo real. En Pomodoro, el nivel refleja el progreso real de
  // la fase.
  const cicloSeg = 300
  const fraccion = progreso ?? (segundos % cicloSeg) / cicloSeg

  // Geometría: UNA sola silueta continua (un solo path, un solo Z),
  // no dos triángulos separados — la versión anterior dejaba un hueco
  // real entre el trapecio de arriba (que cerraba en y=48) y el de
  // abajo (que arrancaba en y=72): nada se dibujaba en el medio. Acá
  // el cuello (x 46–54, y 58–62) es parte de la misma figura, así que
  // no puede volver a aparecer un hueco.
  const alturaCamara = 46 // alto útil de cada cámara (12→58 y 62→108)
  const alturaArriba = alturaCamara * (1 - fraccion)
  const alturaAbajo = alturaCamara * fraccion

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 120" className="size-28 shrink-0">
        {/* silueta completa: fondo + borde, una sola figura */}
        <path
          d="M22 12 L78 12 L54 58 L54 62 L78 108 L22 108 L46 62 L46 58 Z"
          className="fill-muted/50 stroke-muted-foreground/40"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* arena arriba: mismo trapecio superior, recortado por altura */}
        <clipPath id="clipArenaArriba">
          <rect x="22" y={12 + (alturaCamara - alturaArriba)} width="56" height={alturaArriba + 2} />
        </clipPath>
        <path
          d="M22 12 L78 12 L54 58 L46 58 Z"
          className="fill-primary/70 transition-all duration-1000 ease-linear"
          clipPath="url(#clipArenaArriba)"
        />

        {/* arena abajo: mismo trapecio inferior, recortado por altura */}
        <clipPath id="clipArenaAbajo">
          <rect x="22" y={108 - alturaCamara - alturaAbajo} width="56" height={alturaAbajo + 2} />
        </clipPath>
        <path
          d="M46 62 L54 62 L78 108 L22 108 Z"
          className="fill-primary/70 transition-all duration-1000 ease-linear"
          clipPath="url(#clipArenaAbajo)"
        />

        {/* granito cayendo por el cuello (único tramo angosto de la
            figura, x 46–54, y 58–62) — animación de POSICIÓN real
            (no scale), con transform-box: fill-box para que el
            origen de la transformación sea el propio granito */}
        {!pausada && alturaArriba > 1 && (
          <circle
            cx="50"
            cy="60"
            r="1.4"
            className="fill-primary"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'caer-arena 0.7s linear infinite',
            }}
          />
        )}
      </svg>
      <span className="tnum text-[15px] font-medium">{formatearCronometro(segundos)}</span>
    </div>
  )
}

export function RelojPared({ segundos, progreso, pausada }: PropsReloj) {
  const gradosSegundero = (segundos % 60) * 6
  const gradosMinutero = (segundos / 60) * 6

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0">
        <circle cx="60" cy="60" r="56" className="fill-card stroke-border" strokeWidth="2" />
        {progreso !== null && (
          <path
            d={arcoDeProgreso(60, 60, 50, progreso)}
            className="stroke-primary/25 fill-none"
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="60"
            y1="10"
            x2="60"
            y2={i % 3 === 0 ? '18' : '15'}
            className="stroke-muted-foreground/50"
            strokeWidth={i % 3 === 0 ? 2 : 1}
            transform={`rotate(${i * 30} 60 60)`}
          />
        ))}
        {/* minutero — pivota sobre el centro del reloj (coordenada
            absoluta del SVG), no sobre su propio bounding box: por
            eso NO lleva transform-box: fill-box acá */}
        <line
          x1="60"
          y1="60"
          x2="60"
          y2="30"
          className="stroke-foreground/70 transition-transform duration-1000 ease-linear"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            transform: `rotate(${gradosMinutero}deg)`,
            transformOrigin: '60px 60px',
          }}
        />
        {/* segundero — mismo pivote */}
        <line
          x1="60"
          y1="66"
          x2="60"
          y2="16"
          className="stroke-primary transition-transform duration-1000 ease-linear"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{
            transform: `rotate(${gradosSegundero}deg)`,
            transformOrigin: '60px 60px',
            opacity: pausada ? 0.3 : 1,
          }}
        />
        <circle cx="60" cy="60" r="3" className="fill-primary" />
      </svg>
      <span className="tnum text-[15px] font-medium">{formatearCronometro(segundos)}</span>
    </div>
  )
}

function arcoDeProgreso(cx: number, cy: number, r: number, fraccion: number): string {
  const angulo = fraccion * 360 - 90
  const rad = (angulo * Math.PI) / 180
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)
  const grande = fraccion > 0.5 ? 1 : 0
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${grande} 1 ${x} ${y}`
}
