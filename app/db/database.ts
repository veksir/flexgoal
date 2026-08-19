import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'flexgoal.db';
const DATABASE_VERSION = 6;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        creado_en TEXT NOT NULL
      );
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS metas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'activa',
        creado_en TEXT NOT NULL
      );
    `);
  }

  if (currentVersion < 3) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS objetivos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meta_id INTEGER NOT NULL REFERENCES metas(id),
        nombre TEXT NOT NULL,
        creado_en TEXT NOT NULL
      );
    `);
  }

  if (currentVersion < 4) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tareas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        objetivo_id INTEGER NOT NULL REFERENCES objetivos(id),
        nombre TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        creado_en TEXT NOT NULL
      );
    `);
  }

  if (currentVersion < 5) {
    await db.execAsync(`
      ALTER TABLE tareas ADD COLUMN fecha_planificada TEXT;
    `);
  }

  if (currentVersion < 6) {
    await db.execAsync(`
      ALTER TABLE tareas ADD COLUMN duracion_estimada_minutos INTEGER;
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}