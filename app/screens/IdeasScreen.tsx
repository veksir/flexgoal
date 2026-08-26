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
import { color, espacio } from './theme';
import Button from '../components/Button';
import ConversionModal from '../components/ConversionModal';

interface Props {
  db: SQLiteDatabase;
  texto: string;
  setTexto: (texto: string) => void;
}

export default function IdeasScreen({ db, texto, setTexto }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaAConvertir, setIdeaAConvertir] = useState<Idea | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    cargarIdeas();
  }, []);

  async function cargarIdeas() {
    setIdeas(await listarIdeas(db));
  }

  async function guardarIdea() {
    const textoLimpio = texto.trim();
    if (!textoLimpio || isSaving) return;
    setIsSaving(true);
    try {
      await crearIdea(db, textoLimpio);
      setTexto('');
      await cargarIdeas();
    } finally {
      setIsSaving(false);
    }
  }

  async function convertir(plantillaId?: string) {
    if (!ideaAConvertir) return;
    setIsSaving(true);
    try {
      await convertirIdeaEnMeta(db, ideaAConvertir, plantillaId);
      setIdeaAConvertir(null);
      await cargarIdeas();
    } finally {
      setIsSaving(false);
    }
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
      <View style={estilos.composerFila}>
        <TextInput
          style={[estilos.input, estilos.composerInput]}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe una idea..."
          placeholderTextColor="#999"
          multiline
          accessibilityLabel="Nueva idea"
        />
        <Button
          title="➤"
          onPress={guardarIdea}
          disabled={!texto.trim() || isSaving}
          accessibilityLabel="Guardar idea"
          style={[estilos.composerBoton, { minWidth: 0, paddingHorizontal: espacio.md }]}
        />
      </View>
      <FlatList
        data={ideas}
        keyExtractor={(item) => String(item.id)}
        style={{ marginTop: 14 }}
        renderItem={({ item }) => (
          <Pressable
            style={estilos.item}
            onLongPress={() => confirmarEliminacion(item)}
            delayLongPress={500}
            accessibilityLabel={`Idea: ${item.texto}`}
            accessibilityHint="Mantener presionado para eliminar"
          >
            <View style={estilos.itemTextoWrapper}>
              <Text style={estilos.itemTexto}>{item.texto}</Text>
            </View>
            <View style={[estilos.itemContenido, { marginTop: 10, justifyContent: 'flex-end' }]}>
              <Button
                title="Convertir en meta"
                onPress={() => setIdeaAConvertir(item)}
                variant="secondary"
              />
              <Pressable
                style={estilos.botonBasura}
                onPress={() => confirmarEliminacion(item)}
                hitSlop={8}
                accessibilityLabel="Eliminar idea"
                accessibilityRole="button"
              >
                <Text style={estilos.botonBasuraTexto}>🗑️</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={estilos.vacioContenedor}>
            <Text style={estilos.vacioIcono}>💡</Text>
            <Text style={estilos.vacioTitulo}>Aún no tienes ideas guardadas</Text>
            <Text style={estilos.vacioSubtexto}>¡Escribe la primera arriba!</Text>
          </View>
        }
        contentContainerStyle={ideas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
      />

      <ConversionModal
        visible={ideaAConvertir !== null}
        ideaTexto={ideaAConvertir?.texto ?? ''}
        onCancel={() => setIdeaAConvertir(null)}
        onConvertir={convertir}
        onGuardar={() => {}}
        isSaving={isSaving}
      />
    </KeyboardAvoidingView>
  );
}
