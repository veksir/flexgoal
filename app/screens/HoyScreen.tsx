import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import {
  alternarEstadoTarea,
  formatearFecha,
  tareasParaHoy,
  type EstadoTarea,
  type TareaConContexto,
} from '../db/tareas';
import type { SesionActiva } from '../App';
import { estilos } from './estilos';
import { formatearCronometro } from './ObjetivoDetalleScreen';

interface Props {
  sesionActiva: SesionActiva | null;
  tiempoSegundos: number;
  onIniciarSesion: (tarea: TareaConContexto) => void;
  onDetenerSesion: () => void;
}

export default function HoyScreen({
  sesionActiva,
  tiempoSegundos,
  onIniciarSesion,
  onDetenerSesion,
}: Props) {
  const [tareas, setTareas] = useState<TareaConContexto[]>([]);

  useEffect(() => {
    cargarTareas();
  }, []);

  async function cargarTareas() {
    const lista = await tareasParaHoy();
    setTareas(lista);
  }

  async function alternarTarea(tarea: TareaConContexto) {
    const nuevoEstado: EstadoTarea =
      tarea.estado === 'completada' ? 'pendiente' : 'completada';
    await alternarEstadoTarea(tarea.id, nuevoEstado);
    await cargarTareas();
  }

  return (
    <FlatList
      data={tareas}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <Pressable style={estilos.item} onPress={() => alternarTarea(item)}>
          <View style={estilos.tareaContenido}>
            <Text style={estilos.tareaCheck}>☐</Text>
            <View style={estilos.itemTextoWrapper}>
              <Text style={estilos.itemTexto}>
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
          No tienes tareas para hoy. Buen momento para planificar algo.
        </Text>
      }
    />
  );
}