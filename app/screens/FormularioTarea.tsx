import { Pressable, Text, TextInput } from 'react-native';

import {
  esFechaValida,
  esDuracionValida,
} from '../db/tareas';
import { estilos } from './estilos';

interface Props {
  onAgregarTarea: (
    nombre: string,
    fechaPlanificada?: string,
    duracionEstimadaMinutos?: number
  ) => Promise<void>;
  textoTarea: string;
  setTextoTarea: (texto: string) => void;
  textoFechaTarea: string;
  setTextoFechaTarea: (texto: string) => void;
  errorFechaTarea: string;
  setErrorFechaTarea: (error: string) => void;
  textoDuracionTarea: string;
  setTextoDuracionTarea: (texto: string) => void;
  errorDuracionTarea: string;
  setErrorDuracionTarea: (error: string) => void;
}

export default function FormularioTarea({
  onAgregarTarea,
  textoTarea,
  setTextoTarea,
  textoFechaTarea,
  setTextoFechaTarea,
  errorFechaTarea,
  setErrorFechaTarea,
  textoDuracionTarea,
  setTextoDuracionTarea,
  errorDuracionTarea,
  setErrorDuracionTarea,
}: Props) {
  async function guardarTarea() {
    const textoLimpio = textoTarea.trim();
    if (!textoLimpio) {
      return;
    }
    const fechaLimpia = textoFechaTarea.trim();
    if (fechaLimpia && !esFechaValida(fechaLimpia)) {
      setErrorFechaTarea(
        'Fecha inválida. Usa el formato AAAA-MM-DD (ej. 2026-08-20) o déjalo vacío.'
      );
      return;
    }
    const duracionLimpia = textoDuracionTarea.trim();
    if (duracionLimpia && !esDuracionValida(duracionLimpia)) {
      setErrorDuracionTarea(
        'Duración inválida. Usa un número entero de minutos mayor a 0 (ej. 30) o déjalo vacío.'
      );
      return;
    }
    setErrorFechaTarea('');
    setErrorDuracionTarea('');
    await onAgregarTarea(
      textoLimpio,
      fechaLimpia || undefined,
      duracionLimpia ? parseInt(duracionLimpia, 10) : undefined
    );
    setTextoTarea('');
    setTextoFechaTarea('');
    setTextoDuracionTarea('');
  }

  return (
    <>
      <TextInput
        style={estilos.input}
        value={textoTarea}
        onChangeText={setTextoTarea}
        placeholder="Nueva tarea..."
        placeholderTextColor="#999"
        multiline
      />
      <TextInput
        style={estilos.input}
        value={textoFechaTarea}
        onChangeText={setTextoFechaTarea}
        placeholder="AAAA-MM-DD (opcional)"
        placeholderTextColor="#999"
      />
      {errorFechaTarea ? (
        <Text style={estilos.textoError}>{errorFechaTarea}</Text>
      ) : null}
      <TextInput
        style={estilos.input}
        value={textoDuracionTarea}
        onChangeText={setTextoDuracionTarea}
        placeholder="Duración estimada en minutos (opcional)"
        placeholderTextColor="#999"
        keyboardType="numeric"
      />
      {errorDuracionTarea ? (
        <Text style={estilos.textoError}>{errorDuracionTarea}</Text>
      ) : null}
      <Pressable style={estilos.boton} onPress={guardarTarea}>
        <Text style={estilos.botonTexto}>Agregar tarea</Text>
      </Pressable>
    </>
  );
}