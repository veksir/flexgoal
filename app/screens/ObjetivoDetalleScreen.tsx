import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  listarTareasPorObjetivo,
  alternarEstadoTarea,
  eliminarTarea,
  formatearFecha,
  formatearDuracion,
  formatearDiferencia,
  calcularDiferencia,
  actualizarTarea,
  puedeInteractuarConTarea,
  type Tarea,
  type Prioridad,
} from '../db/tareas';
import {
  listarSesionesPorTarea,
  tiempoTotalPorTarea,
  type Sesion,
} from '../db/sesiones';
import type { Objetivo } from '../db/objetivos';
import type { SesionActiva } from '../App';
import type { SQLiteDatabase } from 'expo-sqlite';
import Button from '../components/Button';
import { estilos } from './estilos';
import FormularioTarea from './FormularioTarea';
import type { ModoSesion } from '../db/sesiones';
import EditarTareaModal from '../components/EditarTareaModal';

export function formatearCronometro(segundos: number): string {
  const mm = Math.floor(segundos / 60);
  const ss = segundos % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} ${horas}:${minutos}`;
}

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

interface Props {
  db: SQLiteDatabase;
  objetivo: Objetivo;
  nombreMeta: string;
  onVolver: () => void;
  sesionActiva: SesionActiva | null;
  tiempoSegundos: number;
  onIniciarSesion: (tarea: Tarea) => void;
  onDetenerSesion: () => void;
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
  modoSesion: ModoSesion;
  setModoSesion: (modo: ModoSesion) => void;
  duracionTrabajo: string;
  setDuracionTrabajo: (texto: string) => void;
  duracionDescanso: string;
  setDuracionDescanso: (texto: string) => void;
  onCargarConfigPomodoro: () => void;
}

export default function ObjetivoDetalleScreen({
  db,
  objetivo,
  nombreMeta,
  onVolver,
  sesionActiva,
  tiempoSegundos,
  onIniciarSesion,
  onDetenerSesion,
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
  modoSesion,
  setModoSesion,
  duracionTrabajo,
  setDuracionTrabajo,
  duracionDescanso,
  setDuracionDescanso,
  onCargarConfigPomodoro,
}: Props) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [totalesTareas, setTotalesTareas] = useState<Record<number, number>>({});
  const [historialVisible, setHistorialVisible] = useState(false);
  const [sesionesHistorial, setSesionesHistorial] = useState<Sesion[]>([]);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const sesionActivaAnterior = useRef(sesionActiva);

  useEffect(() => { cargarTareas(); }, []);

  useEffect(() => {
    if (sesionActivaAnterior.current != null && sesionActiva == null) {
      cargarTareas();
    }
    sesionActivaAnterior.current = sesionActiva;
  }, [sesionActiva]);

  async function cargarTareas() {
    const lista = await listarTareasPorObjetivo(db, objetivo.id);
    setTareas(lista);
    const totales: Record<number, number> = {};
    for (const t of lista) {
      totales[t.id] = await tiempoTotalPorTarea(db, t.id);
    }
    setTotalesTareas(totales);
  }

  async function agregarTarea(nombre: string, fechaPlanificada?: string, duracionEstimadaMinutos?: number, prioridad?: Prioridad | null) {
    const { crearTarea } = await import('../db/tareas');
    await crearTarea(db, objetivo.id, nombre, fechaPlanificada, duracionEstimadaMinutos, prioridad);
    setTextoTarea('');
    setTextoFechaTarea('');
    setTextoDuracionTarea('');
    setPrioridadTarea(null);
    await cargarTareas();
  }

  async function guardarEdicion(tareaId: number, datos: { nombre: string; fechaPlanificada: string | null; duracionEstimadaMinutos: number | null; prioridad: Prioridad | null }) {
    setIsSaving(true);
    try {
      await actualizarTarea(db, tareaId, datos);
      setTareaEditando(null);
      await cargarTareas();
    } finally {
      setIsSaving(false);
    }
  }

  async function alternarTarea(tarea: Tarea) {
    const interaccion = puedeInteractuarConTarea(tarea.id, sesionActiva);
    if (interaccion === 'bloqueada') return;

    if (tarea.estado === 'completada') {
      await alternarEstadoTarea(db, tarea.id, 'pendiente');
      await cargarTareas();
      return;
    }

    if (interaccion === 'sesion_propia') {
      Alert.alert('Completar tarea con sesión activa', 'Esta tarea tiene una sesión en curso. Si la completas, la sesión se detendrá y su tiempo se guardará.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Completar y detener', onPress: async () => { await onDetenerSesion(); await alternarEstadoTarea(db, tarea.id, 'completada'); await cargarTareas(); } },
      ]);
      return;
    }

    Alert.alert('Completar tarea', '¿Marcar esta tarea como completada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Completar', onPress: async () => { await alternarEstadoTarea(db, tarea.id, 'completada'); await cargarTareas(); } },
    ]);
  }

  async function confirmarEliminacionTarea(tarea: Tarea) {
    const totalMinutos = await tiempoTotalPorTarea(db, tarea.id);
    if (totalMinutos > 0) {
      Alert.alert('Eliminar tarea', `Esta tarea tiene ${formatearDuracion(totalMinutos)} registrados en sesiones. Si la eliminas, ese tiempo se pierde permanentemente. ¿Eliminar de todas formas?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar de todas formas', style: 'destructive', onPress: async () => { await eliminarTarea(db, tarea.id); await cargarTareas(); } },
      ]);
    } else {
      Alert.alert('Eliminar tarea', '¿Seguro que quieres eliminar esta tarea?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => { await eliminarTarea(db, tarea.id); await cargarTareas(); } },
      ]);
    }
  }

  async function verHistorial(tarea: Tarea) {
    const sesiones = await listarSesionesPorTarea(db, tarea.id);
    setSesionesHistorial(sesiones);
    setHistorialVisible(true);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={estilos.botonVolver} onPress={onVolver} accessibilityLabel={`Volver a ${nombreMeta}`} accessibilityRole="button">
        <Text style={estilos.botonVolverTexto}>← Volver a {nombreMeta}</Text>
      </Pressable>
      <Text style={estilos.tituloDetalle}>{objetivo.nombre}</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <FormularioTarea
          db={db}
          onAgregarTarea={agregarTarea}
          textoTarea={textoTarea}
          setTextoTarea={setTextoTarea}
          textoFechaTarea={textoFechaTarea}
          setTextoFechaTarea={setTextoFechaTarea}
          errorFechaTarea={errorFechaTarea}
          setErrorFechaTarea={setErrorFechaTarea}
          textoDuracionTarea={textoDuracionTarea}
          setTextoDuracionTarea={setTextoDuracionTarea}
          errorDuracionTarea={errorDuracionTarea}
          setErrorDuracionTarea={setErrorDuracionTarea}
          prioridadTarea={prioridadTarea}
          setPrioridadTarea={setPrioridadTarea}
        />
        <View style={{ marginTop: 14 }}>
          {tareas.length === 0 ? (
            <View style={estilos.vacioContenedor}>
              <Text style={estilos.vacioIcono}>📋</Text>
              <Text style={estilos.vacioTitulo}>Sin tareas todavía</Text>
              <Text style={estilos.vacioSubtexto}>Agrega la primera arriba</Text>
            </View>
          ) : (
            tareas.map((item) => {
              const interaccion = puedeInteractuarConTarea(item.id, sesionActiva);
              const totalMinutos = totalesTareas[item.id] ?? 0;
              const estimado = item.duracion_estimada_minutos;
              const diff = estimado != null && totalMinutos > 0 ? calcularDiferencia(totalMinutos, estimado) : null;
              return (
                <View key={item.id} style={estilos.item}>
                  <Pressable
                    style={[estilos.tareaCheckbox, interaccion === 'bloqueada' && { opacity: 0.4 }]}
                    onPress={() => alternarTarea(item)}
                    disabled={interaccion === 'bloqueada'}
                    accessibilityLabel={item.estado === 'completada' ? 'Descompletar' : 'Completar'}
                  >
                    <Text style={estilos.tareaCheck}>{item.estado === 'completada' ? '☑' : '☐'}</Text>
                  </Pressable>
                  <View style={estilos.tareaContenido}>
                    <View style={estilos.itemTextoWrapper}>
                      <Text style={[estilos.itemTexto, item.estado === 'completada' && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                        {item.nombre}
                        {item.fecha_planificada ? ` — ${formatearFecha(item.fecha_planificada)}` : ''}
                        {item.prioridad ? ` · ${etiquetaPrioridad(item.prioridad)}` : ''}
                      </Text>
                      <Text style={estilos.itemFecha}>
                        {totalMinutos > 0 ? `${formatearDuracion(totalMinutos)} registrado` : 'Sin tiempo'}
                        {estimado != null ? ` · Est: ${formatearDuracion(estimado)}` : ''}
                        {diff != null ? ` (${formatearDiferencia(diff)})` : ''}

                      </Text>
                    </View>
                    {interaccion === 'libre' && (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {totalMinutos > 0 && (
                          <Pressable style={estilos.botonSesion} onPress={() => verHistorial(item)} accessibilityLabel="Ver historial" accessibilityRole="button">
                            <Text style={estilos.botonSesionTexto}>📜</Text>
                          </Pressable>
                        )}
                        <Pressable style={estilos.botonSesion} onPress={() => setTareaEditando(item)} accessibilityLabel="Editar tarea" accessibilityRole="button">
                          <Text style={estilos.botonSesionTexto}>✏️</Text>
                        </Pressable>
                        <Pressable style={estilos.botonBasura} onPress={() => confirmarEliminacionTarea(item)} accessibilityLabel="Eliminar tarea" accessibilityRole="button">
                          <Text style={estilos.botonBasuraTexto}>🗑️</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  {sesionActiva?.tareaId === item.id ? (
                    <View style={estilos.sesionContenido}>
                      {sesionActiva.modo === 'pomodoro' && sesionActiva.fase ? (
                        <Text style={estilos.faseEtiqueta}>
                          {sesionActiva.fase === 'trabajo' ? '☕ Trabajo' : '🏖️ Descanso'}
                        </Text>
                      ) : null}
                      <Text style={estilos.cronometro}>{formatearCronometro(tiempoSegundos)}</Text>
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
                            style={[estilos.modoBoton, modoSesion === 'libre' && estilos.modoBotonActivo]}
                            onPress={() => setModoSesion('libre')}
                            accessibilityLabel="Sesión libre"
                            accessibilityRole="button"
                            accessibilityState={{ selected: modoSesion === 'libre' }}
                          >
                            <Text style={[estilos.modoBotonTexto, modoSesion === 'libre' && estilos.modoBotonTextoActivo]}>Sesión libre</Text>
                          </Pressable>
                          <Pressable
                            style={[estilos.modoBoton, modoSesion === 'pomodoro' && estilos.modoBotonActivo]}
                            onPress={() => { setModoSesion('pomodoro'); onCargarConfigPomodoro(); }}
                            accessibilityLabel="Pomodoro"
                            accessibilityRole="button"
                            accessibilityState={{ selected: modoSesion === 'pomodoro' }}
                          >
                            <Text style={[estilos.modoBotonTexto, modoSesion === 'pomodoro' && estilos.modoBotonTextoActivo]}>Pomodoro</Text>
                          </Pressable>
                        </View>
                        {modoSesion === 'pomodoro' && (
                          <View style={estilos.pomodoroInputs}>
                            <View style={estilos.pomodoroInputFila}>
                              <Text style={estilos.pomodoroLabel}>Trabajo:</Text>
                              <TextInput style={estilos.pomodoroInput} value={duracionTrabajo} onChangeText={setDuracionTrabajo} keyboardType="numeric" maxLength={2} />
                              <Text style={estilos.pomodoroUnidad}>min</Text>
                            </View>
                            <View style={estilos.pomodoroInputFila}>
                              <Text style={estilos.pomodoroLabel}>Descanso:</Text>
                              <TextInput style={estilos.pomodoroInput} value={duracionDescanso} onChangeText={setDuracionDescanso} keyboardType="numeric" maxLength={2} />
                              <Text style={estilos.pomodoroUnidad}>min</Text>
                            </View>
                          </View>
                        )}
                        <Button
                          title="Iniciar sesión"
                          onPress={() => onIniciarSesion(item)}
                          style={estilos.botonSesion}
                          textStyle={estilos.botonSesionTexto}
                        />
                      </View>
                    )
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={historialVisible} transparent animationType="fade" onRequestClose={() => setHistorialVisible(false)}>
        <Pressable style={estilos.modalFondo} onPress={() => setHistorialVisible(false)} accessibilityLabel="Cerrar historial" accessibilityRole="button">
          <Pressable style={estilos.modalContenido} onPress={(e) => e.stopPropagation()}>
            <Text style={estilos.tituloDetalle}>Historial de sesiones</Text>
            <ScrollView>
              {sesionesHistorial.length === 0 ? (
                <Text style={estilos.vacioSubtexto}>Sin sesiones registradas</Text>
              ) : (
                sesionesHistorial.map((s) => (
                  <View key={s.id} style={estilos.item}>
                    <Text style={estilos.itemTexto}>{formatearFechaHora(s.creado_en)}</Text>
                    <Text style={estilos.itemFecha}>{formatearDuracion(s.duracion_minutos)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <Button title="Cerrar" onPress={() => setHistorialVisible(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      <EditarTareaModal
        visible={tareaEditando !== null}
        tarea={tareaEditando}
        db={db}
        isSaving={isSaving}
        onClose={() => setTareaEditando(null)}
        onSave={guardarEdicion}
      />
    </KeyboardAvoidingView>
  );
}
