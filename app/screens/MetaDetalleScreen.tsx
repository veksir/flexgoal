import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput } from 'react-native';

import {
  crearObjetivo,
  listarObjetivosPorMeta,
  type Objetivo,
} from '../db/objetivos';
import type { Meta } from '../db/metas';
import { estilos } from './estilos';

interface Props {
  meta: Meta;
  onVolver: () => void;
  onSeleccionarObjetivo: (objetivo: Objetivo) => void;
}

export default function MetaDetalleScreen({
  meta,
  onVolver,
  onSeleccionarObjetivo,
}: Props) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [textoObjetivo, setTextoObjetivo] = useState('');

  useEffect(() => {
    cargarObjetivos();
  }, []);

  async function cargarObjetivos() {
    const lista = await listarObjetivosPorMeta(meta.id);
    setObjetivos(lista);
  }

  async function guardarObjetivo() {
    const textoLimpio = textoObjetivo.trim();
    if (!textoLimpio) {
      return;
    }
    await crearObjetivo(meta.id, textoLimpio);
    setTextoObjetivo('');
    await cargarObjetivos();
  }

  return (
    <>
      <Pressable style={estilos.botonVolver} onPress={onVolver}>
        <Text style={estilos.botonVolverTexto}>← Volver</Text>
      </Pressable>
      <Text style={estilos.subtitulo}>Metas: {meta.nombre}</Text>
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
            <Text style={estilos.itemFecha}>
              {new Date(item.creado_en).toLocaleString()}
            </Text>
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