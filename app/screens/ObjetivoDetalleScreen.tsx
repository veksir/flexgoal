import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import {
  crearTarea,
  listarTareasPorObjetivo,
  alternarEstadoTarea,
  formatearFecha,
  formatearDuracion,
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

  return (
    <>
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>← Volver</Text>
      </Pressable>
      <Text style={estilos.subtitulo}>Objetivo: {objetivo.nombre}</Text>
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
        renderItem={({ item }) => (
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
                  {item.duracion_estimada_minutos != null
                    ? ` — ${formatearDuracion(item.duracion_estimada_minutos)}`
                    : ''}
                </Text>
                <Text style={estilos.itemFecha}>
                  {new Date(item.creado_en).toLocaleString()}
                </Text>
                {totalesTareas[item.id] > 0 ? (
                  <Text style={estilos.sesionTotal}>
                    Total: {formatearDuracion(totalesTareas[item.id])}
                  </Text>
                ) : null}
              </View>
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
        )}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            Este objetivo no tiene tareas todavía. ¡Agrega la primera!
          </Text>
        }
      />
    </>
  );
}

function formatearCronometro(segundos: number): string {
  const mm = Math.floor(segundos / 60);
  const ss = segundos % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}