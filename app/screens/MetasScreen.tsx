import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text } from 'react-native';

import { listarMetas, type Meta } from '../db/metas';
import { estilos } from './estilos';

interface Props {
  onSeleccionarMeta: (meta: Meta) => void;
}

export default function MetasScreen({ onSeleccionarMeta }: Props) {
  const [metas, setMetas] = useState<Meta[]>([]);

  useEffect(() => {
    cargarMetas();
  }, []);

  async function cargarMetas() {
    const lista = await listarMetas();
    setMetas(lista);
  }

  return (
    <FlatList
      data={metas}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <Pressable
          style={estilos.item}
          onPress={() => onSeleccionarMeta(item)}
        >
          <Text style={estilos.itemTexto}>{item.nombre}</Text>
          <Text style={estilos.itemFecha}>Estado: {item.estado}</Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={estilos.vacio}>
          Aún no tienes metas. Convierte una idea en meta para empezar.
        </Text>
      }
    />
  );
}