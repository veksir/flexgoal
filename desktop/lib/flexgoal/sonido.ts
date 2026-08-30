/**
 * Aviso sonoro de cambio de fase en Pomodoro. Generado con Web Audio
 * API (dos tonos suaves, sin archivos externos que empaquetar) — no
 * es un timbre ni una alarma, es un "ding" corto con ataque y caída
 * suaves para no sobresaltar a nadie. Empezar a trabajar sube de
 * tono (activa), empezar a descansar baja (relaja).
 */

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

function tono(frecuencia: number, inicio: number, duracion: number, ctx: AudioContext, destino: GainNode) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frecuencia
  gain.gain.setValueAtTime(0, ctx.currentTime + inicio)
  gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + inicio + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + inicio + duracion)
  osc.connect(gain)
  gain.connect(destino)
  osc.start(ctx.currentTime + inicio)
  osc.stop(ctx.currentTime + inicio + duracion + 0.05)
}

export function reproducirTonoCambioFase(fase: 'trabajo' | 'descanso') {
  const ctx = obtenerContexto()
  if (!ctx) return
  const salida = ctx.createGain()
  salida.connect(ctx.destination)

  if (fase === 'trabajo') {
    // Dos notas ascendentes — "volvés al ruedo"
    tono(523.25, 0, 0.22, ctx, salida) // Do5
    tono(659.25, 0.14, 0.28, ctx, salida) // Mi5
  } else {
    // Dos notas descendentes — "a descansar"
    tono(659.25, 0, 0.22, ctx, salida) // Mi5
    tono(523.25, 0.14, 0.32, ctx, salida) // Do5
  }
}
