import { VISTAS, type Vista } from '../BottomNav';

describe('BottomNav — VISTAS constant', () => {
  test('tiene 5 vistas', () => {
    expect(VISTAS).toHaveLength(5);
  });

  test('las vistas son las rutas principales', () => {
    const ids = VISTAS.map((v) => v.id);
    expect(ids).toEqual(['hoy', 'ideas', 'metas', 'disponibilidad', 'semana']);
  });

  test('cada vista tiene etiqueta e icono', () => {
    for (const vista of VISTAS) {
      expect(vista.etiqueta).toBeTruthy();
      expect(vista.icono).toBeTruthy();
      expect(vista.subtitulo).toBeTruthy();
    }
  });

  test('los ids son tipos válidos de Vista', () => {
    const vistasValidas: Vista[] = ['hoy', 'ideas', 'metas', 'disponibilidad', 'semana'];
    for (const vista of VISTAS) {
      expect(vistasValidas).toContain(vista.id);
    }
  });
});
