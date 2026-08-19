import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { crearIdea, eliminarIdea, listarIdeas, type Idea } from './db/ideas';

export default function App() {
  const [texto, setTexto] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    cargarIdeas();
  }, []);

  async function cargarIdeas() {
    const lista = await listarIdeas();
    setIdeas(lista);
  }

  async function guardarIdea() {
    const textoLimpio = texto.trim();
    if (!textoLimpio) {
      return;
    }
    await crearIdea(textoLimpio);
    setTexto('');
    await cargarIdeas();
  }

  function confirmarEliminacion(idea: Idea) {
    Alert.alert('Eliminar idea', '¿Seguro que quieres eliminar esta idea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarIdea(idea.id);
          await cargarIdeas();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>Bandeja de ideas</Text>
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={setTexto}
        placeholder="Escribe una idea..."
        placeholderTextColor="#999"
        multiline
      />
      <Pressable style={styles.boton} onPress={guardarIdea}>
        <Text style={styles.botonTexto}>Guardar</Text>
      </Pressable>
      <FlatList
        data={ideas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.item}
            onLongPress={() => confirmarEliminacion(item)}
            delayLongPress={500}
          >
            <Text style={styles.itemTexto}>{item.texto}</Text>
            <Text style={styles.itemFecha}>
              {new Date(item.creado_en).toLocaleString()}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            Aún no tienes ideas guardadas. ¡Escribe la primera!
          </Text>
        }
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    fontSize: 16,
    marginBottom: 12,
  },
  boton: {
    backgroundColor: '#1c7ed6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemTexto: {
    fontSize: 16,
  },
  itemFecha: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  vacio: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 32,
  },
});