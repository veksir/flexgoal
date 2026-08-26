import { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import DatePicker from './DatePicker';

import {
  esFechaValida,
  esDuracionValida,
  formatearDuracion,
  formatearDiferencia,
  type Prioridad,
} from '../db/tareas';
import {
  calcularVistaPreviaSobrecarga,
  sugerirDiaAlternativo,
  type VistaPreviaSobrecarga,
  type SugerenciaDia,
} from '../db/carga';
import { nombreDia } from '../db/disponibilidad';
import type { Tarea } from '../db/tareas';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from '../screens/estilos';
import { color, radio } from '../screens/theme';
import { formatearFecha } from '../db/tareas';
import Button from '../components/Button';

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

interface Props {
  visible: boolean;
  tarea: Tarea | null;
  db: SQLiteDatabase;
  isSaving: boolean;
  onClose: () => void;
  onSave: (tareaId: number, datos: {
    nombre: string;
    fechaPlanificada: string | null;
    duracionEstimadaMinutos: number | null;
    prioridad: Prioridad | null;
  }) => Promise<void>;
}

export default function EditarTareaModal({
  visible,
  tarea,
  db,
  isSaving,
  onClose,
  onSave,
}: Props) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [duracion, setDuracion] = useState('');
  const [prioridad, setPrioridad] = useState<Prioridad | null>(null);
  const [errorFecha, setErrorFecha] = useState('');
  const [errorDuracion, setErrorDuracion] = useState('');
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaSobrecarga | null>(null);
  const [sugerencia, setSugerencia] = useState<SugerenciaDia | null>(null);

  useEffect(() => {
    if (tarea) {
      setNombre(tarea.nombre);
      setFecha(tarea.fecha_planificada ?? '');
      setDuracion(tarea.duracion_estimada_minutos?.toString() ?? '');
      setPrioridad(tarea.prioridad);
      setErrorFecha('');
      setErrorDuracion('');
    }
  }, [tarea]);

  useEffect(() => {
    const fechaLimpia = fecha.trim();
    const duracionLimpia = duracion.trim();

    if (!fechaLimpia || !esFechaValida(fechaLimpia) || !duracionLimpia || !esDuracionValida(duracionLimpia)) {
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
          if (!cancelado) setSugerencia(sug);
        });
      } else {
        setSugerencia(null);
      }
    });

    return () => { cancelado = true; };
  }, [db, fecha, duracion]);

  async function handleSave() {
    if (!tarea) return;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    const fechaLimpia = fecha.trim();
    if (fechaLimpia && !esFechaValida(fechaLimpia)) {
      setErrorFecha('Fecha inválida. Usa AAAA-MM-DD.');
      return;
    }
    const duracionLimpia = duracion.trim();
    if (duracionLimpia && !esDuracionValida(duracionLimpia)) {
      setErrorDuracion('Duración inválida. Usa un número entero positivo.');
      return;
    }
    await onSave(tarea.id, {
      nombre: nombreLimpio,
      fechaPlanificada: fechaLimpia || null,
      duracionEstimadaMinutos: duracionLimpia ? parseInt(duracionLimpia, 10) : null,
      prioridad: prioridad ?? null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={estilos.modalFondo} onPress={onClose}>
          <Pressable style={estilos.modalContenido} onPress={(e) => e.stopPropagation()}>
            <Text style={estilos.tituloDetalle}>Editar tarea</Text>
            <TextInput
              style={estilos.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Nombre de la tarea"
              placeholderTextColor="#999"
              multiline
            />
            <DatePicker
              value={fecha}
              onChange={setFecha}
              placeholder="Seleccionar fecha (opcional)"
              error={errorFecha}
            />
            <TextInput
              style={estilos.input}
              value={duracion}
              onChangeText={setDuracion}
              placeholder="Duración estimada en minutos (opcional)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {errorDuracion ? <Text style={estilos.textoError}>{errorDuracion}</Text> : null}
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
                <Pressable
                  style={estilos.botonSugerencia}
                  onPress={() => setFecha(sugerencia.fecha)}
                  accessibilityLabel="Usar esta fecha sugerida"
                  accessibilityRole="button"
                >
                  <Text style={estilos.botonSugerenciaTexto}>Usar esta fecha</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={estilos.estadoContenedor}>
              {PRIORIDADES.map((opcion) => {
                const activo = opcion === prioridad;
                return (
                  <Pressable
                    key={opcion}
                    style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
                    onPress={() => setPrioridad(activo ? null : opcion)}
                    accessibilityLabel={`Prioridad ${etiquetaPrioridad(opcion)}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                  >
                    <Text style={[estilos.estadoBotonTexto, activo && estilos.estadoBotonTextoActivo]}>
                      {etiquetaPrioridad(opcion)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button
                title="Guardar cambios"
                onPress={handleSave}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancelar"
                onPress={onClose}
                variant="secondary"
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
