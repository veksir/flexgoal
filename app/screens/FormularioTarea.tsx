import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  esFechaValida,
  esDuracionValida,
  type Prioridad,
} from '../db/tareas';
import {
  calcularVistaPreviaSobrecarga,
  sugerirDiaAlternativo,
  type VistaPreviaSobrecarga,
  type SugerenciaDia,
} from '../db/carga';
import { nombreDia } from '../db/disponibilidad';
import { formatearDuracion, formatearDiferencia, formatearFecha } from '../db/tareas';
import { estilos } from './estilos';
import { espacio } from './theme';
import Button from '../components/Button';
import DatePicker from '../components/DatePicker';

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

interface Props {
  db: SQLiteDatabase;
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
  db,
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
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaSobrecarga | null>(null);
  const [sugerencia, setSugerencia] = useState<SugerenciaDia | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fechaLimpia = textoFechaTarea.trim();
    const duracionLimpia = textoDuracionTarea.trim();

    if (
      !fechaLimpia ||
      !esFechaValida(fechaLimpia) ||
      !duracionLimpia ||
      !esDuracionValida(duracionLimpia)
    ) {
      setVistaPrevia(null);
      setSugerencia(null);
      return;
    }

    let cancelado = false;
    const minutos = parseInt(duracionLimpia, 10);

    calcularVistaPreviaSobrecarga(db, fechaLimpia, minutos).then((resultado) => {
      if (cancelado) return;
      setVistaPrevia(resultado);
      if (resultado.estaSobrecargado) {
        sugerirDiaAlternativo(db, fechaLimpia, minutos).then((sug) => {
          if (!cancelado) {
            setSugerencia(sug);
          }
        });
      } else {
        setSugerencia(null);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [db, textoFechaTarea, textoDuracionTarea]);
  async function guardarTarea() {
    const textoLimpio = textoTarea.trim();
    if (!textoLimpio || isSaving) {
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
    setIsSaving(true);
    try {
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
    } finally {
      setIsSaving(false);
    }
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
      <DatePicker
        value={textoFechaTarea}
        onChange={setTextoFechaTarea}
        placeholder="Fecha planificada (opcional)"
        error={errorFechaTarea}
      />
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
      {vistaPrevia?.estaSobrecargado ? (
        <Text style={estilos.textoAviso}>
          Ese día quedaría con {formatearDuracion(vistaPrevia.minutosPlanificados)}{' '}
          planificados de {formatearDuracion(vistaPrevia.minutosDisponibles)} disponibles{' '}
          ({formatearDiferencia(vistaPrevia.diferencia)})
        </Text>
      ) : null}
      {vistaPrevia?.estaSobrecargado && sugerencia ? (
        <View style={estilos.sugerenciaContenedor}>
          <Text style={estilos.textoAviso}>
            {(() => {
              const [y, m, d] = sugerencia.fecha.split('-').map(Number);
              return nombreDia(new Date(y, m - 1, d).getDay());
            })()}{' '}
            {formatearFecha(sugerencia.fecha)} tiene{' '}
            {formatearDuracion(sugerencia.minutosDisponibles)} libres
          </Text>
      <Button
        title="Usar esta fecha"
        onPress={() => setTextoFechaTarea(sugerencia.fecha)}
        variant="ghost"
        style={estilos.botonSugerencia}
        textStyle={estilos.botonSugerenciaTexto}
      />
        </View>
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
              accessibilityLabel={`Prioridad ${etiquetaPrioridad(opcion)}`}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
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
      <Button
        title="Agregar tarea"
        onPress={guardarTarea}
        disabled={isSaving}
        style={{ marginTop: espacio.sm }}
      />
    </>
  );
}