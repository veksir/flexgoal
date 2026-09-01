import { hoyISO, sumarDias, indiceDia } from './engine'
import type { EstadoApp, Sesion } from './types'

/**
 * Estado realmente en blanco — ni una idea, ni una meta, ni un
 * minuto de disponibilidad declarado. Es lo que ve alguien que clona
 * el repo y corre la app por primera vez: nada de datos de ejemplo
 * mezclados con los suyos. `estadoInicial()` (más abajo) es el
 * dataset de demostración — solo se usa cuando alguien toca
 * explícitamente "Restaurar ejemplo" en Tiempo, nunca en el primer
 * arranque.
 */
export function estadoVacio(): EstadoApp {
  return {
    version: 1,
    ideas: [],
    metas: [],
    objetivos: [],
    tareas: [],
    sesiones: [],
    disponibilidad: [],
    sugerenciasDescartadas: [],
  }
}

/**
 * Datos de arranque. Existen para que la app se pueda leer el primer día,
 * no para simular éxito: incluyen sesiones parciales y omitidas a propósito.
 */
export function estadoInicial(): EstadoApp {
  const hoy = hoyISO()
  const sesiones: Sesion[] = []
  let n = 0
  const nuevaSesion = (
    tareaId: string,
    fecha: string,
    plan: number,
    real: number | null,
    estado: Sesion['estado'],
    nota?: string,
  ) => {
    sesiones.push({
      id: `ses-${++n}`,
      tareaId,
      fecha,
      minutosPlan: plan,
      minutosReal: real,
      estado,
      nota,
    })
  }

  // --- Historial: 14 días atrás hasta ayer -------------------------------
  // Tarea "escalas" tarda sistemáticamente más -> disparará sugerencia +15
  for (const [i, real] of [38, 42, 45, 40].entries()) {
    nuevaSesion('t-escalas', sumarDias(hoy, -12 + i * 3), 30, real, 'hecha')
  }
  // Tarea "estiramiento" tarda menos -> disparará sugerencia -10
  for (const [i, real] of [12, 10, 14].entries()) {
    nuevaSesion('t-estiramiento', sumarDias(hoy, -9 + i * 3), 20, real, 'hecha')
  }
  nuevaSesion('t-repertorio', sumarDias(hoy, -7), 45, 45, 'hecha')
  nuevaSesion('t-repertorio', sumarDias(hoy, -4), 45, 20, 'parcial', 'Me interrumpieron')
  nuevaSesion('t-esquema', sumarDias(hoy, -6), 60, 60, 'hecha')
  nuevaSesion('t-esquema', sumarDias(hoy, -3), 60, null, 'omitida')
  nuevaSesion('t-trote', sumarDias(hoy, -5), 30, 30, 'hecha')
  nuevaSesion('t-trote', sumarDias(hoy, -2), 30, 22, 'parcial')

  // --- Hoy: plan que excede el tiempo declarado, a propósito ------------
  nuevaSesion('t-escalas', hoy, 30, null, 'planificada')
  nuevaSesion('t-repertorio', hoy, 45, null, 'planificada')
  nuevaSesion('t-esquema', hoy, 60, null, 'planificada')
  nuevaSesion('t-trote', hoy, 30, null, 'planificada')

  // --- Resto de la semana ----------------------------------------------
  const restanDias = 6 - indiceDia(hoy)
  if (restanDias >= 1) {
    nuevaSesion('t-escalas', sumarDias(hoy, 1), 30, null, 'planificada')
    nuevaSesion('t-estiramiento', sumarDias(hoy, 1), 20, null, 'planificada')
  }
  if (restanDias >= 2) {
    nuevaSesion('t-esquema', sumarDias(hoy, 2), 60, null, 'planificada')
  }
  if (restanDias >= 3) {
    nuevaSesion('t-trote', sumarDias(hoy, 3), 40, null, 'planificada')
    nuevaSesion('t-repertorio', sumarDias(hoy, 3), 45, null, 'planificada')
  }

  return {
    version: 1,
    ideas: [
      {
        id: 'i-1',
        titulo: 'Grabar un cover y publicarlo',
        notas: 'Todavía no sé si es parte de la meta de guitarra o algo aparte.',
        estado: 'inbox',
        creadaEn: sumarDias(hoy, -3),
      },
      {
        id: 'i-2',
        titulo: 'Leer un libro técnico por trimestre',
        estado: 'inbox',
        creadaEn: sumarDias(hoy, -8),
      },
      {
        id: 'i-3',
        titulo: 'Aprender guitarra en serio',
        estado: 'promovida',
        creadaEn: sumarDias(hoy, -30),
        metaId: 'm-guitarra',
      },
      {
        id: 'i-4',
        titulo: 'Mudarme de ciudad este año',
        notas: 'Lo pensé una noche. No lo quiero ahora.',
        estado: 'descartada',
        creadaEn: sumarDias(hoy, -21),
      },
    ],
    metas: [
      {
        id: 'm-guitarra',
        titulo: 'Tocar tres canciones completas de memoria',
        porQue: 'Quiero poder sentarme a tocar sin depender de una pantalla.',
        horizonte: sumarDias(hoy, 90),
        estado: 'activa',
        creadaEn: sumarDias(hoy, -30),
      },
      {
        id: 'm-flexgoal',
        titulo: 'Publicar flexgoal v1 y usarlo yo mismo un mes',
        porQue: 'Necesito una herramienta que no me haga sentir en falta.',
        horizonte: sumarDias(hoy, 45),
        estado: 'activa',
        creadaEn: sumarDias(hoy, -60),
      },
      {
        id: 'm-correr',
        titulo: 'Correr 5 km sin caminar',
        porQue: 'Recuperar aire, no bajar de peso.',
        horizonte: sumarDias(hoy, 120),
        estado: 'activa',
        creadaEn: sumarDias(hoy, -20),
      },
      {
        id: 'm-idiomas',
        titulo: 'Retomar alemán',
        porQue: 'Lo dejé a medias y me quedó pendiente.',
        horizonte: sumarDias(hoy, 200),
        estado: 'pausada',
        creadaEn: sumarDias(hoy, -100),
      },
    ],
    objetivos: [
      {
        id: 'o-tecnica',
        metaId: 'm-guitarra',
        titulo: 'Técnica base sólida',
        criterioExito: 'Escalas mayores a 80 bpm sin trabarme.',
        orden: 1,
      },
      {
        id: 'o-canciones',
        metaId: 'm-guitarra',
        titulo: 'Tres canciones montadas',
        criterioExito: 'Toco las tres seguidas sin partitura.',
        orden: 2,
      },
      {
        id: 'o-producto',
        metaId: 'm-flexgoal',
        titulo: 'Definir el alcance de v1',
        criterioExito: 'Documento cerrado y aprobado por mí mismo.',
        orden: 1,
      },
      {
        id: 'o-fondo',
        metaId: 'm-correr',
        titulo: 'Base aeróbica',
        criterioExito: '30 minutos de trote continuo.',
        orden: 1,
      },
    ],
    tareas: [
      {
        id: 't-escalas',
        objetivoId: 'o-tecnica',
        titulo: 'Practicar escalas con metrónomo',
        estimacionMin: 30,
        estado: 'en_progreso',
        ajusteAceptadoMin: 0,
      },
      {
        id: 't-estiramiento',
        objetivoId: 'o-tecnica',
        titulo: 'Estiramiento de manos previo',
        estimacionMin: 20,
        estado: 'en_progreso',
        ajusteAceptadoMin: 0,
      },
      {
        id: 't-repertorio',
        objetivoId: 'o-canciones',
        titulo: 'Montar el puente de la canción 2',
        estimacionMin: 45,
        estado: 'en_progreso',
        ajusteAceptadoMin: 0,
      },
      {
        id: 't-esquema',
        objetivoId: 'o-producto',
        titulo: 'Cerrar el esquema de datos local',
        estimacionMin: 60,
        estado: 'en_progreso',
        ajusteAceptadoMin: 0,
      },
      {
        id: 't-alcance',
        objetivoId: 'o-producto',
        titulo: 'Escribir qué queda fuera de v1',
        estimacionMin: 40,
        estado: 'pendiente',
        ajusteAceptadoMin: 0,
      },
      {
        id: 't-trote',
        objetivoId: 'o-fondo',
        titulo: 'Trote suave continuo',
        estimacionMin: 30,
        estado: 'en_progreso',
        ajusteAceptadoMin: 0,
      },
    ],
    sesiones,
    disponibilidad: [
      { dia: 0, minutos: 120, declarada: true },
      { dia: 1, minutos: 90, declarada: true },
      { dia: 2, minutos: 60, declarada: true },
      { dia: 3, minutos: 90, declarada: true },
      { dia: 4, minutos: 45, declarada: true },
      { dia: 5, minutos: 0, declarada: false },
      { dia: 6, minutos: 0, declarada: false },
    ],
    sugerenciasDescartadas: [],
  }
}
