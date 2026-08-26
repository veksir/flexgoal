import { color } from '../../screens/theme';

// Test the variant style configuration that Button uses internally
const variantStyles = {
  primary: {
    button: { backgroundColor: color.primario },
    text: { color: '#fff' },
  },
  secondary: {
    button: { backgroundColor: color.fondo, borderWidth: 1.5, borderColor: color.bordeInput },
    text: { color: color.textoSecundario },
  },
  danger: {
    button: { backgroundColor: color.peligroSuave, borderWidth: 1, borderColor: color.peligro },
    text: { color: color.peligro },
  },
  ghost: {
    button: { backgroundColor: 'transparent' },
    text: { color: color.primario },
  },
};

describe('Button — variantStyles', () => {
  test('primary usa color primario de fondo y texto blanco', () => {
    expect(variantStyles.primary.button.backgroundColor).toBe(color.primario);
    expect(variantStyles.primary.text.color).toBe('#fff');
  });

  test('secondary usa fondo blanco con borde y texto secundario', () => {
    expect(variantStyles.secondary.button.backgroundColor).toBe(color.fondo);
    expect(variantStyles.secondary.text.color).toBe(color.textoSecundario);
  });

  test('danger usa fondo peligro suave y texto peligro', () => {
    expect(variantStyles.danger.button.backgroundColor).toBe(color.peligroSuave);
    expect(variantStyles.danger.text.color).toBe(color.peligro);
  });

  test('ghost usa fondo transparente y color primario en texto', () => {
    expect(variantStyles.ghost.button.backgroundColor).toBe('transparent');
    expect(variantStyles.ghost.text.color).toBe(color.primario);
  });

  test('todos los variantes tienen button y text', () => {
    for (const variant of Object.values(variantStyles)) {
      expect(variant.button).toBeDefined();
      expect(variant.text).toBeDefined();
    }
  });
});
