import { parseFecha, formatearFechaLocal } from '../DatePicker';

describe('DatePicker — funciones puras', () => {
  describe('parseFecha', () => {
    test('parsea una fecha válida AAAA-MM-DD', () => {
      const resultado = parseFecha('2026-03-15');
      expect(resultado).not.toBeNull();
      expect(resultado!.getFullYear()).toBe(2026);
      expect(resultado!.getMonth()).toBe(2); // marzo = 2 (0-indexed)
      expect(resultado!.getDate()).toBe(15);
    });

    test('retorna null para string vacío', () => {
      expect(parseFecha('')).toBeNull();
    });

    test('retorna null para formato inválido', () => {
      expect(parseFecha('15-03-2026')).toBeNull();
      expect(parseFecha('2026/03/15')).toBeNull();
      expect(parseFecha('hola')).toBeNull();
    });

    test('retorna null para fecha incompleta', () => {
      expect(parseFecha('2026-03')).toBeNull();
      expect(parseFecha('2026')).toBeNull();
    });

    test('parsea el primer día del año', () => {
      const resultado = parseFecha('2026-01-01');
      expect(resultado).not.toBeNull();
      expect(resultado!.getMonth()).toBe(0);
      expect(resultado!.getDate()).toBe(1);
    });

    test('parsea el último día del año', () => {
      const resultado = parseFecha('2026-12-31');
      expect(resultado).not.toBeNull();
      expect(resultado!.getMonth()).toBe(11);
      expect(resultado!.getDate()).toBe(31);
    });
  });

  describe('formatearFechaLocal', () => {
    test('formatea una fecha correctamente', () => {
      const fecha = new Date(2026, 2, 15); // 15 de marzo
      expect(formatearFechaLocal(fecha)).toBe('2026-03-15');
    });

    test('agrega ceros a la izquierda en mes y día', () => {
      const fecha = new Date(2026, 0, 5); // 5 de enero
      expect(formatearFechaLocal(fecha)).toBe('2026-01-05');
    });

    test('maneja el último día del año', () => {
      const fecha = new Date(2026, 11, 31);
      expect(formatearFechaLocal(fecha)).toBe('2026-12-31');
    });
  });

  describe('roundtrip parse ↔ formatear', () => {
    test('formatear(parseFecha(fecha)) devuelve la misma fecha', () => {
      const original = '2026-07-20';
      const parsed = parseFecha(original);
      expect(parsed).not.toBeNull();
      expect(formatearFechaLocal(parsed!)).toBe(original);
    });
  });
});
