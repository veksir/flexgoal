import { crearIdea, listarIdeas, type Idea } from '../ideas';
import { convertirIdeaEnMeta } from '../conversiones';
import { listarMetas } from '../metas';
import { listarObjetivosPorMeta } from '../objetivos';
import { listarTareasPorObjetivo } from '../tareas';
import { PLANTILLAS } from '../plantillasMeta';
import { crearDbPruebas } from './testDb';

describe('plantillas de meta', () => {
  test('convertirIdeaEnMeta sin plantilla crea solo la meta', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Meta sin plantilla');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea);

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);
    expect(metas[0].nombre).toBe('Meta sin plantilla');

    const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
    expect(objetivos).toHaveLength(0);
  });

  test.each(PLANTILLAS)(
    'plantilla "$nombre" crea 3 objetivos y 3 tareas',
    async (plantilla) => {
      const db = crearDbPruebas();
      await crearIdea(db, `Idea para ${plantilla.nombre}`);
      const [idea] = await listarIdeas(db);

      await convertirIdeaEnMeta(db, idea, plantilla.id);

      const metas = await listarMetas(db);
      expect(metas).toHaveLength(1);

      const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
      expect(objetivos).toHaveLength(3);

      for (const obj of objetivos) {
        const tareas = await listarTareasPorObjetivo(db, obj.id);
        expect(tareas).toHaveLength(1);
        expect(tareas[0].estado).toBe('pendiente');
        expect(tareas[0].fecha_planificada).toBeNull();
        expect(tareas[0].duracion_estimada_minutos).toBeNull();
        expect(tareas[0].prioridad).toBeNull();
      }
    }
  );

  test('plantilla "aprender-habilidad" crea objetivos y tareas con contenido correcto', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Aprender piano');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea, 'aprender-habilidad');

    const [meta] = await listarMetas(db);
    const objetivos = await listarObjetivosPorMeta(db, meta.id);
    const nombresObjetivos = objetivos.map((o) => o.nombre);
    expect(nombresObjetivos).toContain('Fundamentos');
    expect(nombresObjetivos).toContain('Práctica regular');
    expect(nombresObjetivos).toContain('Primer resultado real');

    for (const obj of objetivos) {
      const tareas = await listarTareasPorObjetivo(db, obj.id);
      expect(tareas[0].nombre).toBeTruthy();
    }
  });

  test('idea se borra después de convertir con plantilla', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Idea a borrar');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea, 'generica');

    const ideas = await listarIdeas(db);
    expect(ideas).toHaveLength(0);
  });

  test('transacción es atómica: si falla la idea no se borra', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Idea que fallará');
    const [idea] = await listarIdeas(db);

    await expect(
      convertirIdeaEnMeta(db, { ...idea, texto: null as unknown as string })
    ).rejects.toThrow();

    const ideas = await listarIdeas(db);
    expect(ideas).toHaveLength(1);
  });

  test('plantilla incorrecta crea meta sin objetivos (degradación graceful)', async () => {
    const db = crearDbPruebas();
    await crearIdea(db, 'Idea con plantilla inválida');
    const [idea] = await listarIdeas(db);

    await convertirIdeaEnMeta(db, idea, 'no-existe');

    const metas = await listarMetas(db);
    expect(metas).toHaveLength(1);

    const objetivos = await listarObjetivosPorMeta(db, metas[0].id);
    expect(objetivos).toHaveLength(0);
  });
});
