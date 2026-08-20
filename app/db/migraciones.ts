export const DATABASE_VERSION = 9;

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
];