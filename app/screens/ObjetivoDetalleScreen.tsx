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
  crearTarea,
  listarTareasPorObjetivo,
  alternarEstadoTarea,
  eliminarTarea,
  formatearFecha,
  formatearDuracion,
  formatearDiferencia,
  calcularDiferencia,
  esFechaValida,
  esDuracionValida,
  actualizarTarea,
  puedeInteractuarConTarea,
  type EstadoTarea,
  type Tarea,
  type Prioridad,
} from '../db/tareas';
import {
  listarSesionesPorTarea,
  tiempoTotalPorTarea,
  type Sesion,
} from '../db/sesiones';
import {
  calcularVistaPreviaSobrecarga,
  sugerirDiaAlternativo,
  type VistaPreviaSobrecarga,
  type SugerenciaDia,
} from '../db/carga';
import { nombreDia } from '../db/disponibilidad';
import type { Objetivo } from '../db/objetivos';
import type { SesionActiva } from '../App';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';
import { color, radio } from './theme';
import FormularioTarea from './FormularioTarea';
import type { ModoSesion } from '../db/sesiones';

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

function etiquetaPrioridad(prioridad: Prioridad): string {
  return prioridad.charAt(0).toUpperCase() + prioridad.slice(1);
}

const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

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
  const [editNombre, setEditNombre] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editDuracion, setEditDuracion] = useState('');
  const [editPrioridad, setEditPrioridad] = useState<Prioridad | null>(null);
  const [editErrorFecha, setEditErrorFecha] = useState('');
  const [editErrorDuracion, setEditErrorDuracion] = useState('');
  const [editVistaPrevia, setEditVistaPrevia] = useState<VistaPreviaSobrecarga | null>(null);
  const [editSugerencia, setEditSugerencia] = useState<SugerenciaDia | null>(null);
  const sesionActivaAnterior = useRef(sesionActiva);

  useEffect(() => {
    cargarTareas();
  }, []);

  useEffect(() => {
    const transicionADetenida =
      sesionActivaAnterior.current != null && sesionActiva == null;
    sesionActivaAnterior.current = sesionActiva;
    if (transicionADetenida) {
      cargarTareas();
    }
  }, [sesionActiva]);

  useEffect(() => {
    if (!tareaEditando) {
      setEditVistaPrevia(null);
      setEditSugerencia(null);
      return;
    }

    const fechaLimpia = editFecha.trim();
    const duracionLimpia = editDuracion.trim();

    if (
      !fechaLimpia ||
      !esFechaValida(fechaLimpia) ||
      !duracionLimpia ||
      !esDuracionValida(duracionLimpia)
    ) {
      setEditVistaPrevia(null);
      setEditSugerencia(null);
      return;
    }

    let cancelado = false;
    const minutos = parseInt(duracionLimpia, 10);

    calcularVistaPreviaSobrecarga(db, fechaLimpia, minutos, tareaEditando.id).then(
      (resultado) => {
        if (cancelado) return;
        setEditVistaPrevia(resultado);
        if (resultado.estaSobrecargado) {
          sugerirDiaAlternativo(db, fechaLimpia, minutos, tareaEditando.id).then(
            (sug) => {
              if (!cancelado) {
                setEditSugerencia(sug);
              }
            }
          );
        } else {
          setEditSugerencia(null);
        }
      }
    );

    return () => {
      cancelado = true;
    };
  }, [db, tareaEditando, editFecha, editDuracion]);

  async function cargarTareas() {
    const lista = await listarTareasPorObjetivo(db, objetivo.id);
    setTareas(lista);
    const nuevosTotales: Record<number, number> = {};
    for (const tarea of lista) {
      nuevosTotales[tarea.id] = await tiempoTotalPorTarea(db, tarea.id);
    }
    setTotalesTareas(nuevosTotales);
  }

  async function abrirHistorial(tareaId: number) {
    const sesiones = await listarSesionesPorTarea(db, tareaId);
    setSesionesHistorial(sesiones);
    setHistorialVisible(true);
  }

  function cerrarHistorial() {
    setHistorialVisible(false);
    setSesionesHistorial([]);
  }

  async function agregarTarea(
    nombre: string,
    fechaPlanificada?: string,
    duracionEstimadaMinutos?: number,
    prioridad?: Prioridad | null
  ) {
    await crearTarea(
      db,
      objetivo.id,
      nombre,
      fechaPlanificada,
      duracionEstimadaMinutos,
      prioridad
    );
    await cargarTareas();
  }

  function iniciarEdicion(tarea: Tarea) {
    setTareaEditando(tarea);
    setEditNombre(tarea.nombre);
    setEditFecha(tarea.fecha_planificada ?? '');
    setEditDuracion(
      tarea.duracion_estimada_minutos != null
        ? String(tarea.duracion_estimada_minutos)
        : ''
    );
    setEditPrioridad(tarea.prioridad);
    setEditErrorFecha('');
    setEditErrorDuracion('');
  }

  function cerrarEdicionModal() {
    setTareaEditando(null);
  }

  async function guardarEdicion() {
    if (!tareaEditando) return;
    const nombreLimpio = editNombre.trim();
    if (!nombreLimpio) return;
    const fechaLimpia = editFecha.trim();
    if (fechaLimpia && !esFechaValida(fechaLimpia)) {
      setEditErrorFecha('Fecha inválida. Usa AAAA-MM-DD.');
      return;
    }
    const duracionLimpia = editDuracion.trim();
    if (duracionLimpia && !esDuracionValida(duracionLimpia)) {
      setEditErrorDuracion('Duración inválida. Usa un número entero positivo.');
      return;
    }
    await actualizarTarea(db, tareaEditando.id, {
      nombre: nombreLimpio,
      fechaPlanificada: fechaLimpia || null,
      duracionEstimadaMinutos: duracionLimpia
        ? parseInt(duracionLimpia, 10)
        : null,
      prioridad: editPrioridad ?? null,
    });
    setTareaEditando(null);
    await cargarTareas();
  }

  async function alternarTarea(tarea: Tarea) {
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

  async function confirmarEliminacionTarea(tarea: Tarea) {
    const totalMinutos = await tiempoTotalPorTarea(db, tarea.id);
    if (totalMinutos > 0) {
      Alert.alert(
        'Eliminar tarea',
        `Esta tarea tiene ${formatearDuracion(
          totalMinutos
        )} registrados en sesiones. Si la eliminas, ese tiempo se pierde permanentemente. ¿Eliminar de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar de todas formas',
            style: 'destructive',
            onPress: async () => {
              await eliminarTarea(db, tarea.id);
              await cargarTareas();
            },
          },
        ]
      );
      return;
    }
    Alert.alert('Eliminar tarea', '¿Seguro que quieres eliminar esta tarea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarTarea(db, tarea.id);
          await cargarTareas();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>
          ← Volver a {nombreMeta}
        </Text>
      </Pressable>
      <Text style={estilos.tituloDetalle}>
        {nombreMeta} › {objetivo.nombre}
      </Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo}>Nueva tarea</Text>
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
        </View>
      <Text style={estilos.subtitulo}>Tareas</Text>
      {tareas.length === 0 ? (
        <View style={estilos.vacioContenedor}>
          <Text style={estilos.vacioIcono}>✅</Text>
          <Text style={estilos.vacioTitulo}>
            Este objetivo no tiene tareas todavía
          </Text>
          <Text style={estilos.vacioSubtexto}>¡Agrega la primera arriba!</Text>
        </View>
      ) : (
        tareas.map((item) => {
          const realMinutos = totalesTareas[item.id] ?? 0;
          const estimado = item.duracion_estimada_minutos;
          const diferencia = calcularDiferencia(estimado, realMinutos);
          return (
            <Pressable key={item.id} style={estilos.item} onPress={() => alternarTarea(item)}>
              <View style={estilos.tareaContenido}>
                <Text
                  style={[
                    estilos.tareaCheck,
                    item.estado === 'completada' && estilos.tareaCheckCompletado,
                  ]}
                >
                  {item.estado === 'completada' ? '☑' : '☐'}
                </Text>
                <View style={estilos.itemTextoWrapper}>
                  <Text
                    style={[
                      estilos.itemTexto,
                      item.estado === 'completada' && estilos.tareaCompletada,
                    ]}
                  >
                    {item.nombre}
                    {item.fecha_planificada
                      ? ` — ${formatearFecha(item.fecha_planificada)}`
                      : ''}
                    {estimado != null && realMinutos === 0
                      ? ` — ${formatearDuracion(estimado)}`
                      : ''}
                    {item.prioridad
                      ? ` — ${etiquetaPrioridad(item.prioridad)}`
                      : ''}
                  </Text>
                  {estimado != null && realMinutos > 0 && diferencia != null ? (
                    <Pressable onPress={() => abrirHistorial(item.id)}>
                      <Text style={estilos.sesionTotal}>
                        {`Estimado: ${formatearDuracion(estimado)} · Real: ${formatearDuracion(realMinutos)} · ${formatearDiferencia(diferencia)}`}
                      </Text>
                    </Pressable>
                  ) : realMinutos > 0 ? (
                    <Pressable onPress={() => abrirHistorial(item.id)}>
                      <Text style={estilos.sesionTotal}>
                        Total: {formatearDuracion(realMinutos)}{' '}
                        <Text style={estilos.sesionHistorialEnlace}>
                          (ver historial)
                        </Text>
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  style={estilos.botonBasura}
                  onPress={() => iniciarEdicion(item)}
                  hitSlop={8}
                >
                  <Text style={estilos.botonBasuraTexto}>✏️</Text>
                </Pressable>
                <Pressable
                  style={estilos.botonBasura}
                  onPress={() => confirmarEliminacionTarea(item)}
                  hitSlop={8}
                >
                  <Text style={estilos.botonBasuraTexto}>🗑️</Text>
                </Pressable>
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
            </Pressable>
          );
        })
      )}
      <Modal
        visible={historialVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarHistorial}
      >
        <View style={estilos.modalFondo}>
          <View style={estilos.modalContenido}>
            <Text style={estilos.tituloDetalle}>Historial de sesiones</Text>
            {sesionesHistorial.length === 0 ? (
              <Text style={estilos.vacio}>
                Esta tarea aún no tiene sesiones registradas.
              </Text>
            ) : (
              <ScrollView>
                {sesionesHistorial.map((sesion) => (
                  <View key={sesion.id} style={estilos.sesionHistorialItem}>
                    <Text style={estilos.sesionHistorialTexto}>
                      {sesion.duracion_minutos} min —{' '}
                      {formatearFechaHora(sesion.creado_en)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <Pressable style={estilos.boton} onPress={cerrarHistorial}>
              <Text style={estilos.botonTexto}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={tareaEditando !== null}
        transparent
        animationType="slide"
        onRequestClose={cerrarEdicionModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Pressable
          style={estilos.modalFondo}
          onPress={cerrarEdicionModal}
        >
          <Pressable
            style={estilos.modalContenido}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={estilos.tituloDetalle}>Editar tarea</Text>
            <TextInput
              style={estilos.input}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Nombre de la tarea"
              placeholderTextColor="#999"
              multiline
            />
            <TextInput
              style={estilos.input}
              value={editFecha}
              onChangeText={setEditFecha}
              placeholder="AAAA-MM-DD (opcional)"
              placeholderTextColor="#999"
            />
            {editErrorFecha ? (
              <Text style={estilos.textoError}>{editErrorFecha}</Text>
            ) : null}
            <TextInput
              style={estilos.input}
              value={editDuracion}
              onChangeText={setEditDuracion}
              placeholder="Duración estimada en minutos (opcional)"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {editErrorDuracion ? (
              <Text style={estilos.textoError}>{editErrorDuracion}</Text>
            ) : null}
            {editVistaPrevia?.estaSobrecargado ? (
              <Text style={estilos.textoAviso}>
                Ese día quedaría con {formatearDuracion(editVistaPrevia.minutosPlanificados)}{' '}
                planificados de {formatearDuracion(editVistaPrevia.minutosDisponibles)} disponibles{' '}
                ({formatearDiferencia(editVistaPrevia.diferencia)})
              </Text>
            ) : null}
            {editVistaPrevia?.estaSobrecargado && editSugerencia ? (
              <View style={estilos.sugerenciaContenedor}>
                <Text style={estilos.textoAviso}>
                  {(() => {
                    const [y, m, d] = editSugerencia.fecha.split('-').map(Number);
                    return nombreDia(new Date(y, m - 1, d).getDay());
                  })()}{' '}
                  {formatearFecha(editSugerencia.fecha)} tiene{' '}
                  {formatearDuracion(editSugerencia.minutosDisponibles)} libres
                </Text>
                <Pressable
                  style={estilos.botonSugerencia}
                  onPress={() => setEditFecha(editSugerencia.fecha)}
                >
                  <Text style={estilos.botonSugerenciaTexto}>Usar esta fecha</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={estilos.estadoContenedor}>
              {PRIORIDADES.map((opcion) => {
                const activo = opcion === editPrioridad;
                return (
                  <Pressable
                    key={opcion}
                    style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
                    onPress={() =>
                      setEditPrioridad(activo ? null : opcion)
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
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: color.oscuro,
                  borderRadius: radio.md,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={guardarEdicion}
              >
                <Text style={[estilos.botonTexto, { fontSize: 14 }]}>
                  Guardar cambios
                </Text>
              </Pressable>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: color.bordeInput,
                  borderRadius: radio.md,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={cerrarEdicionModal}
              >
                <Text style={{ color: color.textoTerciario, fontSize: 14, fontWeight: '700' }}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
