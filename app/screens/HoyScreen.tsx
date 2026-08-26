import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import {
  alternarEstadoTarea,
  formatearFecha,
  tareasParaHoy,
  puedeInteractuarConTarea,
  type EstadoTarea,
  type TareaConContexto,
} from '../db/tareas';
import type { SesionActiva } from '../App';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';
import { formatearCronometro } from './ObjetivoDetalleScreen';
import type { ModoSesion } from '../db/sesiones';

interface Props {
  db: SQLiteDatabase;
  sesionActiva: SesionActiva | null;
  tiempoSegundos: number;
  onIniciarSesion: (tarea: TareaConContexto) => void;
  onDetenerSesion: () => void;
  modoSesion: ModoSesion;
  setModoSesion: (modo: ModoSesion) => void;
  duracionTrabajo: string;
  setDuracionTrabajo: (texto: string) => void;
  duracionDescanso: string;
  setDuracionDescanso: (texto: string) => void;
  onCargarConfigPomodoro: () => void;
}

export default function HoyScreen({
  db,
  sesionActiva,
  tiempoSegundos,
  onIniciarSesion,
  onDetenerSesion,
  modoSesion,
  setModoSesion,
  duracionTrabajo,
  setDuracionTrabajo,
  duracionDescanso,
  setDuracionDescanso,
  onCargarConfigPomodoro,
}: Props) {
  const [tareas, setTareas] = useState<TareaConContexto[]>([]);

  useEffect(() => {
    cargarTareas();
  }, []);

  async function cargarTareas() {
    const lista = await tareasParaHoy(db);
    setTareas(lista);
  }

  async function alternarTarea(tarea: TareaConContexto) {
    const interaccion = puedeInteractuarConTarea(tarea.id, sesionActiva);

    if (interaccion === 'bloqueada') {
      return;
    }

    if (tarea.estado === 'completada') {
      await alternarEstadoTarea(db, tarea.id, 'pendiente');
      await cargarTareas();
      return;
    }

    if (interaccion === 'sesion_propia') {
      Alert.alert(
        'Completar tarea con sesión activa',
        'Esta tarea tiene una sesión en curso. Si la completas, la sesión se detendrá y su tiempo se guardará.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Completar y detener',
            onPress: async () => {
              await onDetenerSesion();
              await alternarEstadoTarea(db, tarea.id, 'completada');
              await cargarTareas();
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Completar tarea',
      '¿Marcar esta tarea como completada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            await alternarEstadoTarea(db, tarea.id, 'completada');
            await cargarTareas();
          },
        },
      ]
    );
  }

  const pendientes = tareas.filter((t) => t.estado !== 'completada').length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <FlatList
      data={tareas}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        tareas.length > 0 ? (
          <Text style={estilos.contadorTexto}>
            {pendientes === 0
              ? 'Todo listo por hoy 🎉'
              : `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de ${tareas.length}`}
          </Text>
        ) : null
      }
      ListHeaderComponentStyle={{ marginBottom: 10 }}
      renderItem={({ item }) => (
        <View style={estilos.item}>
          <Pressable
            style={estilos.tareaCheckbox}
            onPress={() => alternarTarea(item)}
            accessibilityLabel={item.estado === 'completada' ? 'Descompletar tarea' : 'Completar tarea'}
          >
            <Text style={estilos.tareaCheck}>
              {item.estado === 'completada' ? '☑' : '☐'}
            </Text>
          </Pressable>
          <View style={estilos.tareaContenido}>
            <View style={estilos.itemTextoWrapper}>
              <Text style={[estilos.itemTexto, item.estado === 'completada' && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                {item.nombre}
                {item.fecha_planificada
                  ? ` — ${formatearFecha(item.fecha_planificada)}`
                  : ''}
              </Text>
              <Text style={estilos.itemFecha}>
                {item.nombreMeta} › {item.nombreObjetivo}
              </Text>
            </View>
          </View>
          {sesionActiva?.tareaId === item.id ? (
            <View style={estilos.sesionContenido}>
              {sesionActiva.modo === 'pomodoro' && sesionActiva.fase ? (
                <Text style={estilos.faseEtiqueta}>
                  {sesionActiva.fase === 'trabajo' ? '☕ Trabajo' : '🏖️ Descanso'}
                </Text>
              ) : null}
              <Text style={estilos.cronometro}>
                {sesionActiva.modo === 'pomodoro'
                  ? formatearCronometro(tiempoSegundos)
                  : formatearCronometro(tiempoSegundos)}
              </Text>
              <Pressable style={estilos.botonDetener} onPress={onDetenerSesion}>
                <Text style={estilos.botonDetenerTexto}>Detener</Text>
              </Pressable>
            </View>
          ) : (
            !sesionActiva && (
              <View style={estilos.sesionInicio}>
                <View style={estilos.modoSelector}>
                  <Pressable
                    style={[
                      estilos.modoBoton,
                      modoSesion === 'libre' && estilos.modoBotonActivo,
                    ]}
                    onPress={() => setModoSesion('libre')}
                  >
                    <Text
                      style={[
                        estilos.modoBotonTexto,
                        modoSesion === 'libre' && estilos.modoBotonTextoActivo,
                      ]}
                    >
                      Sesión libre
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      estilos.modoBoton,
                      modoSesion === 'pomodoro' && estilos.modoBotonActivo,
                    ]}
                    onPress={() => {
                      setModoSesion('pomodoro');
                      onCargarConfigPomodoro();
                    }}
                  >
                    <Text
                      style={[
                        estilos.modoBotonTexto,
                        modoSesion === 'pomodoro' && estilos.modoBotonTextoActivo,
                      ]}
                    >
                      Pomodoro
                    </Text>
                  </Pressable>
                </View>
                {modoSesion === 'pomodoro' && (
                  <View style={estilos.pomodoroInputs}>
                    <View style={estilos.pomodoroInputFila}>
                      <Text style={estilos.pomodoroLabel}>Trabajo:</Text>
                      <TextInput
                        style={estilos.pomodoroInput}
                        value={duracionTrabajo}
                        onChangeText={setDuracionTrabajo}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={estilos.pomodoroUnidad}>min</Text>
                    </View>
                    <View style={estilos.pomodoroInputFila}>
                      <Text style={estilos.pomodoroLabel}>Descanso:</Text>
                      <TextInput
                        style={estilos.pomodoroInput}
                        value={duracionDescanso}
                        onChangeText={setDuracionDescanso}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={estilos.pomodoroUnidad}>min</Text>
                    </View>
                  </View>
                )}
                <Pressable
                  style={estilos.botonSesion}
                  onPress={() => onIniciarSesion(item)}
                >
                  <Text style={estilos.botonSesionTexto}>Iniciar sesión</Text>
                </Pressable>
              </View>
            )
          )}
        </View>
      )}
      ListEmptyComponent={
        <View style={estilos.vacioContenedor}>
          <Text style={estilos.vacioIcono}>☀️</Text>
          <Text style={estilos.vacioTitulo}>No tienes tareas para hoy</Text>
          <Text style={estilos.vacioSubtexto}>
            Buen momento para planificar algo desde Metas.
          </Text>
        </View>
      }
      contentContainerStyle={tareas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
    />
    </KeyboardAvoidingView>
  );
}
