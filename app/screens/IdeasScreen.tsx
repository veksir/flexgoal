import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { crearIdea, eliminarIdea, listarIdeas, type Idea } from '../db/ideas';
import { convertirIdeaEnMeta } from '../db/conversiones';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';

interface Props {
  db: SQLiteDatabase;
  texto: string;
  setTexto: (texto: string) => void;
}

export default function IdeasScreen({ db, texto, setTexto }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    cargarIdeas();
  }, []);

  async function cargarIdeas() {
    const lista = await listarIdeas(db);
    setIdeas(lista);
  }

  async function guardarIdea() {
    const textoLimpio = texto.trim();
    if (!textoLimpio) {
      return;
    }
    await crearIdea(db, textoLimpio);
    setTexto('');
    await cargarIdeas();
  }

  async function convertir(idea: Idea) {
    await convertirIdeaEnMeta(db, idea);
    await cargarIdeas();
  }

  function confirmarEliminacion(idea: Idea) {
    Alert.alert('Eliminar idea', '¿Seguro que quieres eliminar esta idea?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await eliminarIdea(db, idea.id);
          await cargarIdeas();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TextInput
        style={estilos.input}
        value={texto}
        onChangeText={setTexto}
        placeholder="Escribe una idea..."
        placeholderTextColor="#999"
        multiline
      />
      <Pressable style={estilos.boton} onPress={guardarIdea}>
        <Text style={estilos.botonTexto}>Guardar</Text>
      </Pressable>
      <FlatList
        data={ideas}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Pressable
            style={estilos.item}
            onLongPress={() => confirmarEliminacion(item)}
            delayLongPress={500}
          >
            <View style={estilos.itemContenido}>
              <View style={estilos.itemTextoWrapper}>
                <Text style={estilos.itemTexto}>{item.texto}</Text>
              </View>
              <Pressable
                style={estilos.botonSecundario}
                onPress={() => convertir(item)}
              >
                <Text style={estilos.botonSecundarioTexto}>
                  Convertir en meta
                </Text>
              </Pressable>
              <Pressable
                style={estilos.botonBasura}
                onPress={() => confirmarEliminacion(item)}
                hitSlop={8}
              >
                <Text style={estilos.botonBasuraTexto}>🗑️</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            Aún no tienes ideas guardadas. ¡Escribe la primera!
          </Text>
        }
      />
    </KeyboardAvoidingView>
  );
}