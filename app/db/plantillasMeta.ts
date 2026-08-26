export interface PlantillaTarea {
  nombre: string;
}

export interface PlantillaObjetivo {
  nombre: string;
  tareas: PlantillaTarea[];
}

export interface PlantillaMeta {
  id: string;
  nombre: string;
  objetivos: PlantillaObjetivo[];
}

export const PLANTILLAS: PlantillaMeta[] = [
  {
    id: 'aprender-habilidad',
    nombre: 'Aprender una habilidad',
    objetivos: [
      {
        nombre: 'Fundamentos',
        tareas: [{ nombre: 'Investigar por dónde empezar / recursos básicos' }],
      },
      {
        nombre: 'Práctica regular',
        tareas: [{ nombre: 'Definir primera sesión de práctica' }],
      },
      {
        nombre: 'Primer resultado real',
        tareas: [{ nombre: 'Definir qué sería una primera prueba concreta' }],
      },
    ],
  },
  {
    id: 'proyecto-fecha-limite',
    nombre: 'Proyecto con fecha límite',
    objetivos: [
      {
        nombre: 'Planificación',
        tareas: [{ nombre: 'Definir el alcance mínimo del proyecto' }],
      },
      {
        nombre: 'Ejecución',
        tareas: [{ nombre: 'Definir el primer paso concreto' }],
      },
      {
        nombre: 'Revisión y entrega',
        tareas: [{ nombre: "Definir criterio de 'terminado'" }],
      },
    ],
  },
  {
    id: 'habito-salud',
    nombre: 'Hábito / salud',
    objetivos: [
      {
        nombre: 'Rutina inicial',
        tareas: [{ nombre: 'Definir frecuencia y horario' }],
      },
      {
        nombre: 'Sostenerlo',
        tareas: [{ nombre: 'Definir cómo voy a hacer seguimiento' }],
      },
      {
        nombre: 'Evaluar y ajustar',
        tareas: [{ nombre: 'Definir fecha de revisión' }],
      },
    ],
  },
  {
    id: 'generica',
    nombre: 'Genérica / no encaja en las anteriores',
    objetivos: [
      {
        nombre: 'Primer paso',
        tareas: [{ nombre: 'Definir el primer paso concreto' }],
      },
      {
        nombre: 'Avance',
        tareas: [{ nombre: 'Definir próximos pasos' }],
      },
      {
        nombre: 'Cierre',
        tareas: [{ nombre: 'Definir cómo se ve terminado' }],
      },
    ],
  },
];

export function obtenerPlantilla(id: string): PlantillaMeta | undefined {
  return PLANTILLAS.find((p) => p.id === id);
}
