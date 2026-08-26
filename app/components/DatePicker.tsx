import { useState } from 'react';
import { Pressable, Platform, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { estilos } from '../screens/estilos';
import { color } from '../screens/theme';

interface Props {
  value: string;
  onChange: (fecha: string) => void;
  placeholder?: string;
  error?: string;
}

export function parseFecha(fecha: string): Date | null {
  if (!fecha) return null;
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function formatearFechaLocal(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DatePicker({ value, onChange, placeholder, error }: Props) {
  const [mostrar, setMostrar] = useState(false);
  const fechaDate = parseFecha(value);

  function handleChange(_event: DateTimePickerEvent, fecha?: Date) {
    if (Platform.OS === 'android') {
      setMostrar(false);
    }
    if (fecha) {
      onChange(formatearFechaLocal(fecha));
    }
  }

  return (
    <View>
      <Pressable
        style={[estilos.input, { justifyContent: 'center' }]}
        onPress={() => setMostrar(true)}
      >
        <Text style={{ color: value ? color.textoPrimario : color.textoDeshabilitado, fontSize: 16 }}>
          {value || placeholder || 'Seleccionar fecha'}
        </Text>
      </Pressable>
      {error ? <Text style={estilos.textoError}>{error}</Text> : null}
      {mostrar && (
        <DateTimePicker
          value={fechaDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={new Date(2020, 0, 1)}
          maximumDate={new Date(2030, 11, 31)}
        />
      )}
    </View>
  );
}
