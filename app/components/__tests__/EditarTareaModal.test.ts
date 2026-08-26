import { etiquetaPrioridad } from '../EditarTareaModal';

describe('EditarTareaModal — funciones puras', () => {
  describe('etiquetaPrioridad', () => {
    test('capitaliza "alta"', () => {
      expect(etiquetaPrioridad('alta')).toBe('Alta');
    });

    test('capitaliza "media"', () => {
      expect(etiquetaPrioridad('media')).toBe('Media');
    });

    test('capitaliza "baja"', () => {
      expect(etiquetaPrioridad('baja')).toBe('Baja');
    });
  });
});
