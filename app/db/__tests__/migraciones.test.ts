import {
  adaptar,
  aplicarMigraciones,
  crearNodoCrudo,
} from './testDb';
import { crearMeta, listarMetas } from '../metas';
import { crearObjetivo, listarObjetivosPorMeta } from '../objetivos';
import {
  crearTarea,
  listarTareasPorObjetivo,
  type Tarea,
} from '../tareas';

describe('migraciones', () => {
  test('migraciones no rompen datos existentes al subir de versión (historias 5 y 6)', async () => {
    const nodo = crearNodoCrudo();
    aplicarMigraciones(nodo, 4);

    nodo
      .prepare(
        'INSERT INTO metas (nombre, estado, creado_en) VALUES (?, ?, ?)'
      )
      .run('Meta vieja', 'activa', new Date().toISOString());
    const metaId = Number(
      nodo.prepare('SELECT id FROM metas').get()!.id
    );
    nodo
      .prepare(
        'INSERT INTO objetivos (meta_id, nombre, creado_en) VALUES (?, ?, ?)'
      )
      .run(metaId, 'Objetivo viejo', new Date().toISOString());
    const objetivoId = Number(
      nodo.prepare('SELECT id FROM objetivos').get()!.id
    );
    nodo
      .prepare(
        "INSERT INTO tareas (objetivo_id, nombre, estado, creado_en) VALUES (?, ?, 'pendiente', ?)"
      )
      .run(objetivoId, 'Tarea vieja', new Date().toISOString());
    const tareaId = Number(
      nodo.prepare('SELECT id FROM tareas').get()!.id
    );

    aplicarMigraciones(nodo, 10);

    const db = adaptar(nodo);
    const metas = await listarMetas(db);
    const [objetivo] = await listarObjetivosPorMeta(db, metaId);
    const tareas = await listarTareasPorObjetivo(db, objetivo.id);

    expect(metas).toHaveLength(1);
    expect(metas[0].nombre).toBe('Meta vieja');
    expect(metas[0].categoria).toBeNull();
    expect(metas[0].prioridad).toBeNull();
    expect(metas[0].fecha_objetivo).toBeNull();
    expect(objetivo.nombre).toBe('Objetivo viejo');
    expect(tareas).toHaveLength(1);
    expect(tareas[0].id).toBe(tareaId);
    expect(tareas[0].nombre).toBe('Tarea vieja');
    expect(tareas[0].fecha_planificada).toBeNull();
    expect(tareas[0].duracion_estimada_minutos).toBeNull();
    expect(tareas[0].prioridad).toBeNull();
  });

  test('después de migrar, las columnas nuevas funcionan (fecha y duración)', async () => {
    const nodo = crearNodoCrudo();
    aplicarMigraciones(nodo, 4);

    nodo
      .prepare(
        'INSERT INTO metas (nombre, estado, creado_en) VALUES (?, ?, ?)'
      )
      .run('Meta', 'activa', new Date().toISOString());
    const metaId = Number(nodo.prepare('SELECT id FROM metas').get()!.id);
    nodo
      .prepare(
        'INSERT INTO objetivos (meta_id, nombre, creado_en) VALUES (?, ?, ?)'
      )
      .run(metaId, 'Objetivo', new Date().toISOString());
    const objetivoId = Number(
      nodo.prepare('SELECT id FROM objetivos').get()!.id
    );

    aplicarMigraciones(nodo, 10);

    const db = adaptar(nodo);
    await crearTarea(db, objetivoId, 'Tarea nueva', '2026-08-19', 45);
    const tareas = await listarTareasPorObjetivo(db, objetivoId);

    const tarea = tareas.find((t) => t.nombre === 'Tarea nueva') as Tarea;
    expect(tarea.fecha_planificada).toBe('2026-08-19');
    expect(tarea.duracion_estimada_minutos).toBe(45);
  });

  test('metas previas a la historia 13 sobreviven la migración con categoria NULL', async () => {
    const nodo = crearNodoCrudo();
    aplicarMigraciones(nodo, 7);

    nodo
      .prepare('INSERT INTO metas (nombre, estado, creado_en) VALUES (?, ?, ?)')
      .run('Meta vieja', 'activa', new Date().toISOString());

    aplicarMigraciones(nodo, 11);

    const db = adaptar(nodo);
    const [meta] = await listarMetas(db);

    expect(meta.nombre).toBe('Meta vieja');
    expect(meta.estado).toBe('activa');
    expect(meta.categoria).toBeNull();
  });
});