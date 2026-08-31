'use client'

/**
 * Ventana de sesión enfocada — aparece automáticamente cuando se
 * inicia un cronómetro desde Hoy, sin importar en qué pantalla se
 * esté (está montada una sola vez en el Shell). Deliberadamente NO es
 * solo un reloj: muestra qué tarea es, para qué meta importa (con su
 * "por qué"), cuánto se lleva acumulado en el día, y dónde estás
 * dentro de la fase de Pomodoro si aplica — para que se sienta como
 * un lugar, no como una alarma.
 */

import { useEffect, useState } from 'react'
import { Check, Coffee, Minimize2, Pause, Play, Save, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { formatoMin } from '@/lib/flexgoal/engine'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { formatearCronometro, useCronometro } from '@/lib/flexgoal/cronometro'
import { RelojArena, RelojCronometro, RelojPared } from '@/components/relojes-sesion'

export function VentanaSesion() {
  const {
    activa,
    pausar,
    reanudar,
    confirmarCambioFase,
    detener,
    configPomodoro,
    estiloReloj,
  } = useCronometro()
  const { estado, registrarSesion, registrarProgreso } = useFlexgoal()
  const [minimizada, setMinimizada] = useState(false)

  useEffect(() => {
    if (activa) setMinimizada(false)
  }, [activa?.sesionId])

  // Si la fase se cumplió y está esperando confirmación, la ventana
  // se abre sola aunque estuviera minimizada — no tiene sentido
  // avisar con sonido/notificación del sistema y dejar la tarjeta
  // flotante chiquita como si nada.
  useEffect(() => {
    if (activa?.esperandoConfirmacionFase) setMinimizada(false)
  }, [activa?.esperandoConfirmacionFase])

  if (!activa) return null

  const tarea = estado.tareas.find((t) => t.id === activa.tareaId)
  const objetivo = tarea ? estado.objetivos.find((o) => o.id === tarea.objetivoId) : undefined
  const meta = objetivo ? estado.metas.find((m) => m.id === objetivo.metaId) : undefined

  const limiteFaseSeg =
    activa.modo === 'pomodoro'
      ? (activa.fase === 'trabajo' ? configPomodoro.trabajoMin : configPomodoro.descansoMin) * 60
      : null
  const progresoFase = limiteFaseSeg ? Math.min(1, activa.segundosFaseActual / limiteFaseSeg) : null
  // El reloj de pared usa segundosTotales (nunca se reinicia, como un
  // reloj de pared real). Cronómetro y arena usan el progreso DENTRO
  // de la fase actual, que sí se reinicia — eso es correcto para
  // ellos, representan "cuánto llevo de esta fase".
  const segundosFase = activa.modo === 'pomodoro' ? activa.segundosFaseActual : activa.segundosTrabajo

  const hoyISO = new Date().toISOString().slice(0, 10)
  const minutosHoyCerradas = estado.sesiones
    .filter((s) => s.fecha === hoyISO && s.minutosReal !== null)
    .reduce((acc, s) => acc + (s.minutosReal ?? 0), 0)
  const minutosHoyTotal = minutosHoyCerradas + Math.round(activa.segundosTrabajo / 60)

  function detenerYRegistrar() {
    const resultado = detener()
    if (resultado) registrarSesion(resultado.sesionId, resultado.minutos)
  }

  // "Sigo después": guarda el tiempo real pero no cierra la sesión —
  // se queda en "Por hacer", no hay que ir a buscarla en el archivo.
  function guardarYSeguirDespues() {
    const resultado = detener()
    if (resultado) registrarProgreso(resultado.sesionId, resultado.minutos)
  }

  if (minimizada) {
    return (
      <button
        type="button"
        onClick={() => setMinimizada(false)}
        className="bg-card fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-lg transition-transform hover:scale-105"
      >
        <span
          className="bg-primary size-2 rounded-full"
          style={{ animation: activa.pausada ? 'none' : 'pulso-suave 1.8s ease-in-out infinite' }}
          aria-hidden
        />
        <span className="tnum text-[13px] font-medium">{formatearCronometro(segundosFase)}</span>
        <span className="text-muted-foreground max-w-[16ch] truncate text-[12px]">
          {tarea?.titulo ?? 'Sesión'}
        </span>
      </button>
    )
  }

  return (
    <div className="animate-in fade-in bg-background/85 fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm duration-300">
      <button
        type="button"
        onClick={() => setMinimizada(true)}
        aria-label="Minimizar (la sesión sigue corriendo)"
        className="hover:bg-accent focus-visible:ring-ring absolute top-5 right-5 flex size-10 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Minimize2 className="size-4" aria-hidden />
      </button>

      <div className="bg-card animate-in zoom-in-95 relative w-full max-w-sm overflow-hidden rounded-2xl border p-8 text-center shadow-2xl duration-300">
        {/* fondo ambiental: dos manchas suaves que respiran, no compiten con el contenido */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className="bg-primary/15 absolute -top-16 -left-10 size-56 rounded-full blur-3xl"
            style={{ animation: 'flotar 9s ease-in-out infinite' }}
          />
          <div
            className="bg-primary/10 absolute -right-12 -bottom-20 size-64 rounded-full blur-3xl"
            style={{ animation: 'flotar 12s ease-in-out infinite reverse' }}
          />
        </div>

        {activa.esperandoConfirmacionFase ? (
          // Banner de cambio de fase: reemplaza el reloj mientras
          // espera. Deliberadamente simple (un ícono, una frase corta,
          // un botón) — nada de texto largo ni varias líneas de
          // datos, para que se lea de un vistazo.
          <div className="animate-in zoom-in-95 flex flex-col items-center gap-4 py-6 duration-200">
            <span className="bg-primary/12 text-primary flex size-16 items-center justify-center rounded-full">
              {activa.fase === 'trabajo' ? (
                <Coffee className="size-7" aria-hidden />
              ) : (
                <Sparkles className="size-7" aria-hidden />
              )}
            </span>
            <div>
              <p className="text-[16px] font-semibold">
                {activa.fase === 'trabajo' ? 'Tiempo de enfoque cumplido' : 'Descanso cumplido'}
              </p>
              <p className="text-muted-foreground mt-1 text-[13px]">
                {activa.fase === 'trabajo' ? '¿Pasás a descanso?' : '¿Volvés a enfocarte?'}
              </p>
            </div>
            <Button onClick={confirmarCambioFase} className="h-10 w-full max-w-[220px]">
              {activa.fase === 'trabajo' ? (
                <>
                  <Coffee className="size-4" aria-hidden /> Pasar a descanso
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden /> Volver a enfocarme
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {activa.modo === 'pomodoro' && (
              <span
                className={cn(
                  'mb-4 inline-block rounded-full px-3 py-1 text-[11.5px] font-medium',
                  activa.fase === 'trabajo'
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {activa.fase === 'trabajo' ? 'Enfoque' : 'Descanso'}
              </span>
            )}

            <div className="flex justify-center">
              {estiloReloj === 'cronometro' && (
                <RelojCronometro segundos={segundosFase} progreso={progresoFase} pausada={activa.pausada} />
              )}
              {estiloReloj === 'arena' && (
                <RelojArena segundos={segundosFase} progreso={progresoFase} pausada={activa.pausada} />
              )}
              {estiloReloj === 'pared' && (
                <RelojPared segundos={activa.segundosTotales} progreso={progresoFase} pausada={activa.pausada} />
              )}
            </div>

            <p className="mt-5 text-[16px] leading-snug font-semibold text-pretty">
              {tarea?.titulo ?? 'Sesión sin tarea asociada'}
            </p>
            {meta && objetivo && (
              <p className="text-muted-foreground mt-1 truncate text-[13px]">
                {meta.titulo} <span aria-hidden>·</span> {objetivo.titulo}
              </p>
            )}
            {meta?.porQue && (
              <p className="text-muted-foreground mx-auto mt-3 max-w-[36ch] text-[12.5px] leading-relaxed text-pretty italic">
                &ldquo;{meta.porQue}&rdquo;
              </p>
            )}

            <p className="text-muted-foreground mt-4 text-[11.5px]">
              Hoy llevás {formatoMin(minutosHoyTotal)} enfocado
            </p>

            {activa.pausada && (
              <p className="text-amber-600 mt-1 text-[11.5px] font-medium">En pausa</p>
            )}

            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="flex justify-center gap-2">
                {activa.pausada ? (
                  <Button onClick={reanudar} className="h-10">
                    <Play className="size-4" aria-hidden />
                    Reanudar
                  </Button>
                ) : (
                  <Button variant="outline" onClick={pausar} className="h-10">
                    <Pause className="size-4" aria-hidden />
                    Pausar
                  </Button>
                )}
                <Button variant="destructive" onClick={detenerYRegistrar} className="h-10">
                  <Check className="size-4" aria-hidden />
                  Terminé
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={guardarYSeguirDespues}
                className="text-muted-foreground h-9 text-[12.5px]"
              >
                <Save className="size-3.5" aria-hidden />
                Todavía no — guardar y seguir después
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
