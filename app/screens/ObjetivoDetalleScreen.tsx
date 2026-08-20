import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import {
  crearTarea,
  listarTareasPorObjetivo,
  alternarEstadoTarea,
  eliminarTarea,
  formatearFecha,
  formatearDuracion,
  formatearDiferencia,
  calcularDiferencia,
  type EstadoTarea,
  type Tarea,
} from '../db/tareas';
import { tiempoTotalPorTarea } from '../db/sesiones';
import type { Objetivo } from '../db/objetivos';
import type { SesionActiva } from '../App';
import { estilos } from './estilos';
import FormularioTarea from './FormularioTarea';

interface Props {
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
}

export default function ObjetivoDetalleScreen({
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
}: Props) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [totalesTareas, setTotalesTareas] = useState<Record<number, number>>({});
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

  async function cargarTareas() {
    const lista = await listarTareasPorObjetivo(objetivo.id);
    setTareas(lista);
    const nuevosTotales: Record<number, number> = {};
    for (const tarea of lista) {
      nuevosTotales[tarea.id] = await tiempoTotalPorTarea(tarea.id);
    }
    setTotalesTareas(nuevosTotales);
  }

  async function agregarTarea(
    nombre: string,
    fechaPlanificada?: string,
    duracionEstimadaMinutos?: number
  ) {
    await crearTarea(objetivo.id, nombre, fechaPlanificada, duracionEstimadaMinutos);
    await cargarTareas();
  }

  async function alternarTarea(tarea: Tarea) {
    const nuevoEstado: EstadoTarea =
      tarea.estado === 'completada' ? 'pendiente' : 'completada';
    await alternarEstadoTarea(tarea.id, nuevoEstado);
    await cargarTareas();
  }

  async function confirmarEliminacionTarea(tarea: Tarea) {
    const totalMinutos = await tiempoTotalPorTarea(tarea.id);
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
              await eliminarTarea(tarea.id);
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
          await eliminarTarea(tarea.id);
          await cargarTareas();
        },
      },
    ]);
  }

  return (
    <>
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>
          ← Volver a {nombreMeta}
        </Text>
      </Pressable>
      <Text style={estilos.tituloDetalle}>
        {nombreMeta} › {objetivo.nombre}
      </Text>
      <FormularioTarea
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
      />
      <FlatList
        data={tareas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const realMinutos = totalesTareas[item.id] ?? 0;
          const estimado = item.duracion_estimada_minutos;
          const diferencia = calcularDiferencia(estimado, realMinutos);
          return (
            <Pressable style={estilos.item} onPress={() => alternarTarea(item)}>
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
                  </Text>
                  {estimado != null && realMinutos > 0 && diferencia != null ? (
                    <Text style={estilos.sesionTotal}>
                      {`Estimado: ${formatearDuracion(estimado)} · Real: ${formatearDuracion(realMinutos)} · ${formatearDiferencia(diferencia)}`}
                    </Text>
                  ) : realMinutos > 0 ? (
                    <Text style={estilos.sesionTotal}>
                      Total: {formatearDuracion(realMinutos)}
                    </Text>
                  ) : null}
                </View>
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
                  <Text style={estilos.cronometro}>
                    {formatearCronometro(tiempoSegundos)}
                  </Text>
                  <Pressable style={estilos.botonDetener} onPress={onDetenerSesion}>
                    <Text style={estilos.botonDetenerTexto}>Detener</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={estilos.botonSesion}
                  onPress={() => onIniciarSesion(item)}
                >
                  <Text style={estilos.botonSesionTexto}>Iniciar sesión</Text>
                </Pressable>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            Este objetivo no tiene tareas todavía. ¡Agrega la primera!
          </Text>
        }
      />
    </>
  );
}

export function formatearCronometro(segundos: number): string {
  const mm = Math.floor(segundos / 60);
  const ss = segundos % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}
