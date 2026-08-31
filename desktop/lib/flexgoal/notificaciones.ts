/**
 * Notificación del sistema operativo (fuera de la ventana de la app)
 * para el cambio de fase de Pomodoro. Usa la Notification API
 * estándar del navegador — Electron la implementa de forma nativa en
 * el renderer sin necesitar IPC ni permisos especiales del proceso
 * principal, así que funciona igual acá que en cualquier web.
 *
 * Por qué hace falta además del sonido: si el usuario está muy
 * concentrado (o tiene el volumen bajo, o la app minimizada/detrás de
 * otra ventana), un sonido corto se puede perder. Una notificación
 * del sistema queda visible hasta que se la mira.
 */

let permisoYaPedido = false

export function pedirPermisoNotificaciones() {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (permisoYaPedido) return
  permisoYaPedido = true
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {
      /* si el usuario lo niega, seguimos solo con el sonido y el
         aviso dentro de la app — no insistimos */
    })
  }
}

export function notificarCambioFase(faseQueTermino: 'trabajo' | 'descanso') {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const titulo =
    faseQueTermino === 'trabajo' ? 'Tiempo de enfoque cumplido' : 'Descanso cumplido'
  const cuerpo =
    faseQueTermino === 'trabajo'
      ? 'Volvé a flexgoal cuando quieras pasar a descanso.'
      : 'Volvé a flexgoal cuando quieras retomar el enfoque.'

  try {
    const notificacion = new Notification(titulo, {
      body: cuerpo,
      silent: true, // el aviso sonoro ya lo maneja sonido.ts, evita duplicar
      tag: 'flexgoal-cambio-fase', // reemplaza la anterior en vez de apilar
    })
    notificacion.onclick = () => {
      window.focus()
      notificacion.close()
    }
  } catch {
    /* en algunos entornos (ej. sin permisos del SO) esto puede
       fallar igual aunque Notification.permission diga 'granted' —
       no es crítico, el sonido y el aviso dentro de la app siguen
       funcionando */
  }
}
