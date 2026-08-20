import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_VERSION, MIGRACIONES } from '../migraciones';

function normalizarFila<T>(fila: Record<string, unknown>): T {
  return { ...fila } as T;
}

function crearTxn(nodo: DatabaseSync): SQLiteDatabase {
  return {
    runAsync: async (sql: string, ...params: SQLInputValue[]) => {
      const resultado = nodo.prepare(sql).run(...params);
      return {
        changes: Number(resultado.changes),
        lastInsertRowid: Number(resultado.lastInsertRowid),
      };
    },
  } as unknown as SQLiteDatabase;
}

export function adaptar(nodo: DatabaseSync): SQLiteDatabase {
  const conexion: SQLiteDatabase = {
    runAsync: async (sql: string, ...params: SQLInputValue[]) => {
      const resultado = nodo.prepare(sql).run(...params);
      return {
        changes: Number(resultado.changes),
        lastInsertRowid: Number(resultado.lastInsertRowid),
      };
    },
    getAllAsync: async <T>(sql: string, ...params: SQLInputValue[]) => {
      const filas = nodo.prepare(sql).all(...params);
      return filas.map(normalizarFila<T>);
    },
    getFirstAsync: async <T>(sql: string, ...params: SQLInputValue[]) => {
      const fila = nodo.prepare(sql).get(...params);
      return fila === undefined ? null : normalizarFila<T>(fila);
    },
    execAsync: async (sql: string) => {
      nodo.exec(sql);
    },
    withExclusiveTransactionAsync: async (
      tarea: (txn: SQLiteDatabase) => Promise<void>
    ) => {
      nodo.exec('BEGIN');
      try {
        await tarea(crearTxn(nodo));
        nodo.exec('COMMIT');
      } catch (error) {
        nodo.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;
  return conexion;
}

export function aplicarMigraciones(
  nodo: DatabaseSync,
  hastaVersion: number
): void {
  const resultado = nodo.prepare('PRAGMA user_version').get() as {
    user_version: number;
  } | null;
  const actual = resultado?.user_version ?? 0;

  if (actual >= hastaVersion) {
    return;
  }

  for (const migracion of MIGRACIONES) {
    if (migracion.version > actual && migracion.version <= hastaVersion) {
      nodo.exec(migracion.sql);
    }
  }
  nodo.exec(`PRAGMA user_version = ${hastaVersion}`);
}

export function crearNodoCrudo(): DatabaseSync {
  const nodo = new DatabaseSync(':memory:');
  nodo.exec('PRAGMA foreign_keys = ON;');
  return nodo;
}

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function crearDbPruebas(): SQLiteDatabase {
  const nodo = crearNodoCrudo();
  aplicarMigraciones(nodo, DATABASE_VERSION);
  return adaptar(nodo);
}