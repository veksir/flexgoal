'use client'

/**
 * Los tres estilos de reloj de la ventana de sesión enfocada.
 * Todos reciben los mismos datos (segundos transcurridos, progreso de
 * la fase si aplica, si está pausado) y deciden solos cómo animarse.
 * Nada de @keyframes ciegos: la posición de manecillas/arena se
 * calcula del estado real cada segundo, con transition-transform
 * suavizando el paso de un segundo a otro.
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
    <div className="relative flex size-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
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
      <div className="flex flex-col items-center gap-1">
        <span className="tnum text-3xl font-semibold tabular-nums">
          {formatearCronometro(segundos)}
        </span>
        <span
          className="bg-primary size-1.5 rounded-full"
          style={{ animation: pausada ? 'none' : 'pulso-suave 1.8s ease-in-out infinite' }}
          aria-hidden
        />
      </div>
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
  const alturaArriba = 34 * (1 - fraccion)
  const alturaAbajo = 34 * fraccion

  return (
    <div className="relative flex size-40 items-center justify-center">
      <svg viewBox="0 0 100 120" className="size-28">
        <path
          d="M22 8 H78 V8 C78 30 58 40 50 48 C42 40 22 30 22 8 Z
             M22 112 H78 V112 C78 90 58 80 50 72 C42 80 22 90 22 112 Z"
          className="fill-muted/50 stroke-muted-foreground/40"
          strokeWidth="2"
        />
        {/* arena arriba */}
        <clipPath id="clipArriba">
          <rect x="22" y={12 + (34 - alturaArriba)} width="56" height={alturaArriba + 2} />
        </clipPath>
        <path
          d="M22 8 H78 V8 C78 30 58 40 50 48 C42 40 22 30 22 8 Z"
          className="fill-primary/70 transition-all duration-1000 ease-linear"
          clipPath="url(#clipArriba)"
        />
        {/* arena abajo */}
        <clipPath id="clipAbajo">
          <rect x="22" y={112 - 12 - alturaAbajo} width="56" height={alturaAbajo + 2} />
        </clipPath>
        <path
          d="M22 112 H78 V112 C78 90 58 80 50 72 C42 80 22 90 22 112 Z"
          className="fill-primary/70 transition-all duration-1000 ease-linear"
          clipPath="url(#clipAbajo)"
        />
        {/* hilo de arena cayendo */}
        {!pausada && (
          <rect
            x="49"
            y="50"
            width="2"
            height="20"
            className="fill-primary/80"
            style={{ animation: 'pulso-suave 0.6s ease-in-out infinite' }}
          />
        )}
      </svg>
      <span className="tnum absolute bottom-0 text-[13px] font-medium">
        {formatearCronometro(segundos)}
      </span>
    </div>
  )
}

export function RelojPared({ segundos, progreso, pausada }: PropsReloj) {
  const gradosSegundero = (segundos % 60) * 6
  const gradosMinutero = (segundos / 60) * 6

  return (
    <div className="relative flex size-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-36">
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
        {/* minutero */}
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
        {/* segundero */}
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
      <span className="tnum absolute bottom-0 text-[12px] font-medium">
        {formatearCronometro(segundos)}
      </span>
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
