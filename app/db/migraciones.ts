export const DATABASE_VERSION = 13;

export interface Migracion {
  version: number;
  sql: string;
}

export const MIGRACIONES: Migracion[] = [
  {
    version: 1,
    sql: `
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        creado_en TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activa',
        creado_en TEXT NOT NULL
      );
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS objetivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meta_id INTEGER NOT NULL REFERENCES metas(id),
        nombre TEXT NOT NULL,
        creado_en TEXT NOT NULL
      );
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        objetivo_id INTEGER NOT NULL REFERENCES objetivos(id),
        nombre TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        creado_en TEXT NOT NULL
      );
    `,
  },
  {
    version: 5,
    sql: `
      ALTER TABLE tareas ADD COLUMN fecha_planificada TEXT;
    `,
  },
  {
    version: 6,
    sql: `
      ALTER TABLE tareas ADD COLUMN duracion_estimada_minutos INTEGER;
    `,
  },
  {
    version: 7,
    sql: `
      CREATE TABLE IF NOT EXISTS sesiones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarea_id INTEGER NOT NULL REFERENCES tareas(id),
        duracion_minutos INTEGER NOT NULL,
        creado_en TEXT NOT NULL
      );
    `,
  },
  {
    version: 8,
    sql: `
      ALTER TABLE metas ADD COLUMN categoria TEXT;
    `,
  },
  {
    version: 9,
    sql: `
      ALTER TABLE metas ADD COLUMN prioridad TEXT;
      ALTER TABLE tareas ADD COLUMN prioridad TEXT;
    `,
  },
  {
    version: 10,
    sql: `
      ALTER TABLE metas ADD COLUMN fecha_objetivo TEXT;
    `,
  },
  {
    version: 11,
    sql: `
      CREATE TABLE sesion_activa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tarea_id INTEGER NOT NULL REFERENCES tareas(id),
        inicio TEXT NOT NULL
      );
    `,
  },
  {
    version: 12,
    sql: `
      ALTER TABLE sesion_activa ADD COLUMN modo TEXT NOT NULL DEFAULT 'libre';
      ALTER TABLE sesion_activa ADD COLUMN fase TEXT;
      ALTER TABLE sesion_activa ADD COLUMN fin_esperado TEXT;

      CREATE TABLE configuracion_pomodoro (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        duracion_trabajo_minutos INTEGER NOT NULL DEFAULT 25,
        duracion_descanso_minutos INTEGER NOT NULL DEFAULT 5
      );
    `,
  },
  {
    version: 13,
    sql: `
      CREATE TABLE disponibilidad (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dia_semana INTEGER NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_fin TEXT NOT NULL
      );
    `,
  },
];