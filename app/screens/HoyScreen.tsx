import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import {
  alternarEstadoTarea,
  formatearDiferencia,
  formatearFecha,
  tareasParaHoy,
  puedeInteractuarConTarea,
  type TareaConContexto,
} from '../db/tareas';
import { calcularCargaDia, type DiaCarga } from '../db/carga';
import type { SesionActiva } from '../App';
import type { SQLiteDatabase } from 'expo-sqlite';
import Button from '../components/Button';
import { estilos } from './estilos';
import { formatearCronometro } from './ObjetivoDetalleScreen';
import type { ModoSesion } from '../db/sesiones';

interface Props {
  db: SQLiteDatabase;
  sesionActiva: SesionActiva | null;
  tiempoSegundos: number;
  onIniciarSesion: (tarea: TareaConContexto, modo?: ModoSesion) => void;
  onDetenerSesion: () => void;
  duracionTrabajo: string;
  setDuracionTrabajo: (texto: string) => void;
  duracionDescanso: string;
  setDuracionDescanso: (texto: string) => void;
  onCargarConfigPomodoro: () => void;
}

// Fila del timeline: puede ser una etiqueta de grupo ("Vencidas" / "Hoy")
// o una tarea. Se combinan en una sola lista para que el riel visual sea
// continuo dentro de un único FlatList.
type FilaTimeline =
  | { tipo: 'grupo'; clave: string; etiqueta: string }
  | { tipo: 'tarea'; clave: string; tarea: TareaConContexto; vencida: boolean };

function fechaDeHoyISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function HoyScreen({
  db,
  sesionActiva,
  tiempoSegundos,
  onIniciarSesion,
  onDetenerSesion,
  duracionTrabajo,
  setDuracionTrabajo,
  duracionDescanso,
  setDuracionDescanso,
  onCargarConfigPomodoro,
}: Props) {
  const [tareas, setTareas] = useState<TareaConContexto[]>([]);
  const [modosPorTarea, setModosPorTarea] = useState<Record<number, ModoSesion>>({});
  const [cargaHoy, setCargaHoy] = useState<DiaCarga | null>(null);

  function getModoTarea(tareaId: number): ModoSesion {
    return modosPorTarea[tareaId] ?? 'libre';
  }

  function setModoTarea(tareaId: number, modo: ModoSesion) {
    setModosPorTarea((prev) => ({ ...prev, [tareaId]: modo }));
  }

  useEffect(() => {
    cargarTareas();
  }, []);

  async function cargarTareas() {
    const lista = await tareasParaHoy(db);
    setTareas(lista);
    // Vista informativa de sobrecarga del día — no afecta la lista de
    // tareas en sí, solo el aviso que se muestra arriba del timeline.
    const carga = await calcularCargaDia(db, fechaDeHoyISO());
    setCargaHoy(carga);
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

  // Arma un único arreglo de filas (grupo + tareas) para que el riel del
  // timeline sea continuo. "Vencidas" son tareas con fecha_planificada
  // anterior a hoy (tareasParaHoy ya las incluye); "Hoy" son las de la
  // fecha actual.
  const hoyISO = fechaDeHoyISO();
  const vencidas = tareas.filter((t) => t.fecha_planificada && t.fecha_planificada < hoyISO);
  const deHoy = tareas.filter((t) => !t.fecha_planificada || t.fecha_planificada >= hoyISO);

  const filas: FilaTimeline[] = [];
  if (vencidas.length > 0) {
    filas.push({ tipo: 'grupo', clave: 'grupo-vencidas', etiqueta: 'Vencidas' });
    vencidas.forEach((t) => filas.push({ tipo: 'tarea', clave: `t-${t.id}`, tarea: t, vencida: true }));
  }
  if (deHoy.length > 0) {
    if (vencidas.length > 0) {
      filas.push({ tipo: 'grupo', clave: 'grupo-hoy', etiqueta: 'Hoy' });
    }
    deHoy.forEach((t) => filas.push({ tipo: 'tarea', clave: `t-${t.id}`, tarea: t, vencida: false }));
  }

  function renderTarea(item: TareaConContexto, vencida: boolean) {
    const enSesion = sesionActiva?.tareaId === item.id;
    return (
      <View style={estilos.lineaTiempoFila}>
        <View style={estilos.lineaTiempoRielColumna}>
          <View style={estilos.lineaTiempoRielSegmento} />
          <View
            style={[
              estilos.lineaTiempoPunto,
              item.estado === 'completada' && estilos.lineaTiempoPuntoCompletada,
              enSesion && estilos.lineaTiempoPuntoActiva,
              vencida && item.estado !== 'completada' && estilos.lineaTiempoPuntoVencida,
            ]}
          />
          <View style={estilos.lineaTiempoRielSegmento} />
        </View>
        <View style={estilos.lineaTiempoTarjetaWrapper}>
          <View
            style={[
              estilos.lineaTiempoTarjeta,
              item.estado === 'completada' && estilos.lineaTiempoTarjetaCompletada,
              enSesion && estilos.lineaTiempoTarjetaActiva,
            ]}
          >
            <View style={estilos.itemContenido}>
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
                  <Text
                    style={[
                      estilos.itemTexto,
                      item.estado === 'completada' && { textDecorationLine: 'line-through', opacity: 0.5 },
                    ]}
                  >
                    {item.nombre}
                    {item.fecha_planificada ? ` — ${formatearFecha(item.fecha_planificada)}` : ''}
                  </Text>
                  <Text style={estilos.itemFecha}>
                    {item.nombreMeta} › {item.nombreObjetivo}
                  </Text>
                </View>
              </View>
            </View>

            {enSesion ? (
              <View style={estilos.sesionContenido}>
                {sesionActiva.modo === 'pomodoro' && sesionActiva.fase ? (
                  <Text style={estilos.faseEtiqueta}>
                    {sesionActiva.fase === 'trabajo' ? '☕ Trabajo' : '🏖️ Descanso'}
                  </Text>
                ) : null}
                <Text style={estilos.cronometro}>
                  {formatearCronometro(tiempoSegundos)}
                </Text>
                <Button
                  title="Detener"
                  onPress={onDetenerSesion}
                  variant="danger"
                  style={estilos.botonDetener}
                  textStyle={estilos.botonDetenerTexto}
                />
              </View>
            ) : (
              !sesionActiva && (
                <View style={estilos.sesionInicio}>
                  <View style={estilos.modoSelector}>
                    <Pressable
                      style={[
                        estilos.modoBoton,
                        getModoTarea(item.id) === 'libre' && estilos.modoBotonActivo,
                      ]}
                      onPress={() => setModoTarea(item.id, 'libre')}
                      accessibilityLabel="Sesión libre"
                      accessibilityRole="button"
                      accessibilityState={{ selected: getModoTarea(item.id) === 'libre' }}
                    >
                      <Text
                        style={[
                          estilos.modoBotonTexto,
                          getModoTarea(item.id) === 'libre' && estilos.modoBotonTextoActivo,
                        ]}
                      >
                        Sesión libre
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        estilos.modoBoton,
                        getModoTarea(item.id) === 'pomodoro' && estilos.modoBotonActivo,
                      ]}
                      onPress={() => {
                        setModoTarea(item.id, 'pomodoro');
                        onCargarConfigPomodoro();
                      }}
                      accessibilityLabel="Pomodoro"
                      accessibilityRole="button"
                      accessibilityState={{ selected: getModoTarea(item.id) === 'pomodoro' }}
                    >
                      <Text
                        style={[
                          estilos.modoBotonTexto,
                          getModoTarea(item.id) === 'pomodoro' && estilos.modoBotonTextoActivo,
                        ]}
                      >
                        Pomodoro
                      </Text>
                    </Pressable>
                  </View>
                  {getModoTarea(item.id) === 'pomodoro' && (
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
                  <Button
                    title="Iniciar sesión"
                    onPress={() => onIniciarSesion(item, getModoTarea(item.id))}
                    style={estilos.botonSesion}
                    textStyle={estilos.botonSesionTexto}
                  />
                </View>
              )
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <FlatList
      data={filas}
      keyExtractor={(fila) => fila.clave}
      ListHeaderComponent={
        <View>
          {tareas.length > 0 ? (
            <Text style={estilos.contadorTexto}>
              {pendientes === 0
                ? 'Todo listo por hoy 🎉'
                : `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de ${tareas.length}`}
            </Text>
          ) : null}
          {cargaHoy?.estaSobrecargado ? (
            <View style={estilos.avisoSobrecarga}>
              <Text style={estilos.avisoSobrecargaIcono}>⚠️</Text>
              <Text style={estilos.avisoSobrecargaTexto}>
                Día sobrecargado: {formatearDiferencia(cargaHoy.diferencia)} sobre tu
                disponibilidad declarada.
              </Text>
            </View>
          ) : null}
        </View>
      }
      ListHeaderComponentStyle={{ marginBottom: 10 }}
      renderItem={({ item }) =>
        item.tipo === 'grupo' ? (
          <Text style={[estilos.lineaTiempoEtiquetaGrupo, { paddingLeft: 22 + 8 }]}>
            {item.etiqueta}
          </Text>
        ) : (
          renderTarea(item.tarea, item.vencida)
        )
      }
      ListEmptyComponent={
        <View style={estilos.vacioContenedor}>
          <Text style={estilos.vacioIcono}>☀️</Text>
          <Text style={estilos.vacioTitulo}>No tienes tareas para hoy</Text>
          <Text style={estilos.vacioSubtexto}>
            Buen momento para planificar algo desde Metas.
          </Text>
        </View>
      }
      contentContainerStyle={filas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
    />
    </KeyboardAvoidingView>
  );
}
