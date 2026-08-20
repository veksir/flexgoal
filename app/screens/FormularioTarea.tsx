import { Pressable, Text, TextInput, View } from 'react-native';

import {
  esFechaValida,
  esDuracionValida,
  type Prioridad,
} from '../db/tareas';
import { estilos } from './estilos';

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

interface Props {
  onAgregarTarea: (
    nombre: string,
    fechaPlanificada?: string,
    duracionEstimadaMinutos?: number,
    prioridad?: Prioridad | null
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
  prioridadTarea: Prioridad | null;
  setPrioridadTarea: (prioridad: Prioridad | null) => void;
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
  prioridadTarea,
  setPrioridadTarea,
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
      duracionLimpia ? parseInt(duracionLimpia, 10) : undefined,
      prioridadTarea ?? undefined
    );
    setTextoTarea('');
    setTextoFechaTarea('');
    setTextoDuracionTarea('');
    setPrioridadTarea(null);
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
      <View style={estilos.estadoContenedor}>
        {PRIORIDADES.map((opcion) => {
          const activo = opcion === prioridadTarea;
          return (
            <Pressable
              key={opcion}
              style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
              onPress={() =>
                setPrioridadTarea(activo ? null : opcion)
              }
            >
              <Text
                style={[
                  estilos.estadoBotonTexto,
                  activo && estilos.estadoBotonTextoActivo,
                ]}
              >
                {etiquetaPrioridad(opcion)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={estilos.boton} onPress={guardarTarea}>
        <Text style={estilos.botonTexto}>Agregar tarea</Text>
      </Pressable>
    </>
  );
}