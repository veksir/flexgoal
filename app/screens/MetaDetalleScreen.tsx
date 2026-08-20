import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import {
  crearObjetivo,
  listarObjetivosPorMeta,
  type Objetivo,
} from '../db/objetivos';
import {
  actualizarCategoriaMeta,
  actualizarEstadoMeta,
  actualizarPrioridadMeta,
  type Meta,
} from '../db/metas';
import type { Prioridad } from '../db/tareas';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';

const ESTADOS_META = ['activa', 'pausada', 'completada', 'abandonada'] as const;
const PRIORIDADES: Prioridad[] = ['alta', 'media', 'baja'];

function etiquetaEstado(estado: string): string {
  return estado.charAt(0).toUpperCase() + estado.slice(1);
}

interface Props {
  db: SQLiteDatabase;
  meta: Meta;
  onVolver: () => void;
  onSeleccionarObjetivo: (objetivo: Objetivo) => void;
  textoObjetivo: string;
  setTextoObjetivo: (texto: string) => void;
}

export default function MetaDetalleScreen({
  db,
  meta,
  onVolver,
  onSeleccionarObjetivo,
  textoObjetivo,
  setTextoObjetivo,
}: Props) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estado, setEstado] = useState(meta.estado);
  const [textoCategoria, setTextoCategoria] = useState(meta.categoria ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad | null>(meta.prioridad);

  useEffect(() => {
    cargarObjetivos();
  }, []);

  async function cambiarEstado(nuevoEstado: string) {
    await actualizarEstadoMeta(db, meta.id, nuevoEstado);
    setEstado(nuevoEstado);
  }

  async function cambiarPrioridad(nuevaPrioridad: Prioridad) {
    await actualizarPrioridadMeta(db, meta.id, nuevaPrioridad);
    setPrioridad(nuevaPrioridad);
  }

  async function guardarCategoria() {
    const textoCategoriaLimpio = textoCategoria.trim();
    await actualizarCategoriaMeta(
      db,
      meta.id,
      textoCategoriaLimpio === '' ? null : textoCategoriaLimpio
    );
    setTextoCategoria(textoCategoriaLimpio);
  }

  async function cargarObjetivos() {
    const lista = await listarObjetivosPorMeta(db, meta.id);
    setObjetivos(lista);
  }

  async function guardarObjetivo() {
    const textoLimpio = textoObjetivo.trim();
    if (!textoLimpio) {
      return;
    }
    await crearObjetivo(db, meta.id, textoLimpio);
    setTextoObjetivo('');
    await cargarObjetivos();
  }

  return (
    <>
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>← Volver a Metas</Text>
      </Pressable>
      <Text style={estilos.tituloDetalle}>{meta.nombre}</Text>
      <Text style={estilos.estadoEtiqueta}>Categoría (opcional)</Text>
      <TextInput
        style={estilos.input}
        value={textoCategoria}
        onChangeText={setTextoCategoria}
        placeholder="Ej. Salud, Trabajo, Finanzas..."
        placeholderTextColor="#999"
      />
      <Pressable style={estilos.botonSesion} onPress={guardarCategoria}>
        <Text style={estilos.botonSesionTexto}>Guardar categoría</Text>
      </Pressable>
      <Text style={estilos.estadoEtiqueta}>Prioridad</Text>
      <View style={estilos.estadoContenedor}>
        {PRIORIDADES.map((opcion) => {
          const activo = opcion === prioridad;
          return (
            <Pressable
              key={opcion}
              style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
              onPress={() => cambiarPrioridad(opcion)}
            >
              <Text
                style={[
                  estilos.estadoBotonTexto,
                  activo && estilos.estadoBotonTextoActivo,
                ]}
              >
                {etiquetaEstado(opcion)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={estilos.estadoEtiqueta}>Estado</Text>
      <View style={estilos.estadoContenedor}>
        {ESTADOS_META.map((opcion) => {
          const activo = opcion === estado;
          return (
            <Pressable
              key={opcion}
              style={[estilos.estadoBoton, activo && estilos.estadoBotonActivo]}
              onPress={() => cambiarEstado(opcion)}
            >
              <Text
                style={[
                  estilos.estadoBotonTexto,
                  activo && estilos.estadoBotonTextoActivo,
                ]}
              >
                {etiquetaEstado(opcion)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={estilos.input}
        value={textoObjetivo}
        onChangeText={setTextoObjetivo}
        placeholder="Nuevo objetivo..."
        placeholderTextColor="#999"
        multiline
      />
      <Pressable style={estilos.boton} onPress={guardarObjetivo}>
        <Text style={estilos.botonTexto}>Agregar objetivo</Text>
      </Pressable>
      <FlatList
        data={objetivos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={estilos.item}
            onPress={() => onSeleccionarObjetivo(item)}
          >
            <Text style={estilos.itemTexto}>{item.nombre}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            Esta meta no tiene objetivos todavía. ¡Agrega el primero!
          </Text>
        }
      />
    </>
  );
}