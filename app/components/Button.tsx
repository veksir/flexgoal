import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from 'react-native';
import { color, espacio, radio, toqueMinimo } from '../screens/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

const variantStyles: Record<ButtonVariant, { button: ViewStyle; text: TextStyle }> = {
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

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
}: Props) {
  const v = variantStyles[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        v.button,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      <Text style={[styles.text, v.text, textStyle]}>
        {loading ? '...' : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radio.md,
    paddingHorizontal: espacio.base,
    paddingVertical: espacio.sm,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
