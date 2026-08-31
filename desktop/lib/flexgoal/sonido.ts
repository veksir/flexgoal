/**
 * Aviso sonoro de cambio de fase en Pomodoro. Generado con Web Audio
 * API (nada de archivos externos que empaquetar). Varias familias de
 * tono para elegir en Diseño — todas cortas, con ataque y caída
 * suaves, pensadas para no sobresaltar.
 */

export type SonidoFase = 'campanita' | 'suave' | 'xilofono' | 'ninguno'

let contexto: AudioContext | null = null

function obtenerContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!contexto) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return null
    contexto = new AudioCtx()
  }
  return contexto
}

function tono(
  frecuencia: number,
  inicio: number,
  duracion: number,
  ctx: AudioContext,
  destino: GainNode,
  tipo: OscillatorType = 'sine',
  volumen = 0.16,
) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = tipo
  osc.frequency.value = frecuencia
  gain.gain.setValueAtTime(0, ctx.currentTime + inicio)
  gain.gain.linearRampToValueAtTime(volumen, ctx.currentTime + inicio + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracion)
  osc.connect(gain)
  gain.connect(destino)
  osc.start(ctx.currentTime + inicio)
  osc.stop(ctx.currentTime + inicio + duracion + 0.05)
}

export function reproducirTonoCambioFase(fase: 'trabajo' | 'descanso', sonido: SonidoFase) {
  if (sonido === 'ninguno') return
  const ctx = obtenerContexto()
  if (!ctx) return
  const salida = ctx.createGain()
  salida.connect(ctx.destination)

  const empezandoTrabajo = fase === 'trabajo' // "fase" acá es la que TERMINÓ

  if (sonido === 'campanita') {
    // Dos notas — ascienden al volver a enfoque, descienden al pasar a descanso
    if (empezandoTrabajo) {
      tono(523.25, 0, 0.22, ctx, salida) // Do5
      tono(659.25, 0.14, 0.28, ctx, salida) // Mi5
    } else {
      tono(659.25, 0, 0.22, ctx, salida) // Mi5
      tono(523.25, 0.14, 0.32, ctx, salida) // Do5
    }
  } else if (sonido === 'suave') {
    // Un solo tono largo y grave, casi un "hum" — el más discreto
    tono(392, 0, 0.6, ctx, salida, 'sine', 0.1) // Sol4
  } else if (sonido === 'xilofono') {
    // Tres notas cortas tipo xilófono, triangulares (más brillante)
    const base = empezandoTrabajo ? [659.25, 783.99, 987.77] : [987.77, 783.99, 659.25]
    base.forEach((freq, i) => tono(freq, i * 0.11, 0.18, ctx, salida, 'triangle', 0.12))
  }
}
