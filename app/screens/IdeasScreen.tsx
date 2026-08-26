import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { crearIdea, eliminarIdea, listarIdeas, type Idea } from '../db/ideas';
import { convertirIdeaEnMeta } from '../db/conversiones';
import { PLANTILLAS } from '../db/plantillasMeta';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estilos } from './estilos';
import { color, espacio, radio, sombraFlotante } from './theme';

interface Props {
  db: SQLiteDatabase;
  texto: string;
  setTexto: (texto: string) => void;
}

export default function IdeasScreen({ db, texto, setTexto }: Props) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaAConvertir, setIdeaAConvertir] = useState<Idea | null>(null);

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

  async function convertir(plantillaId?: string) {
    if (!ideaAConvertir) return;
    await convertirIdeaEnMeta(db, ideaAConvertir, plantillaId);
    setIdeaAConvertir(null);
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
      <View style={estilos.composerFila}>
        <TextInput
          style={[estilos.input, estilos.composerInput]}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe una idea..."
          placeholderTextColor="#999"
          multiline
        />
        <Pressable
          style={[estilos.composerBoton, !texto.trim() && { opacity: 0.4 }]}
          onPress={guardarIdea}
          disabled={!texto.trim()}
          accessibilityLabel="Guardar idea"
        >
          <Text style={estilos.composerBotonTexto}>➤</Text>
        </Pressable>
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
          >
            <View style={estilos.itemTextoWrapper}>
              <Text style={estilos.itemTexto}>{item.texto}</Text>
            </View>
            <View style={[estilos.itemContenido, { marginTop: 10, justifyContent: 'flex-end' }]}>
              <Pressable
                style={estilos.botonSecundario}
                onPress={() => setIdeaAConvertir(item)}
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
          <View style={estilos.vacioContenedor}>
            <Text style={estilos.vacioIcono}>💡</Text>
            <Text style={estilos.vacioTitulo}>Aún no tienes ideas guardadas</Text>
            <Text style={estilos.vacioSubtexto}>¡Escribe la primera arriba!</Text>
          </View>
        }
        contentContainerStyle={ideas.length === 0 ? { flexGrow: 1 } : { paddingBottom: 8 }}
      />
      <Modal
        visible={ideaAConvertir !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIdeaAConvertir(null)}
      >
        <View style={estilos.modalFondo}>
          <View style={estilos.modalContenido}>
            <Text style={[estilos.subtitulo, { marginBottom: espacio.base }]}>
              Elegí una plantilla
            </Text>
            <Pressable
              style={[
                plantillaBoton,
                { marginBottom: espacio.sm },
              ]}
              onPress={() => convertir()}
            >
              <Text style={plantillaBotonTexto}>Empezar vacío</Text>
              <Text style={plantillaBotonSubtexto}>
                Solo crear la meta, sin objetivos
              </Text>
            </Pressable>
            {PLANTILLAS.map((p) => (
              <Pressable
                key={p.id}
                style={[
                  plantillaBoton,
                  { marginBottom: espacio.sm },
                ]}
                onPress={() => convertir(p.id)}
              >
                <Text style={plantillaBotonTexto}>{p.nombre}</Text>
                <Text style={plantillaBotonSubtexto}>
                  {p.objetivos.length} objetivos ·{' '}
                  {p.objetivos.reduce((acc, o) => acc + o.tareas.length, 0)} tareas
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[
                plantillaBotonCancelar,
                { marginTop: espacio.xs },
              ]}
              onPress={() => setIdeaAConvertir(null)}
            >
              <Text style={plantillaBotonCancelarTexto}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

import { StyleSheet } from 'react-native';

const plantillaEstilos = StyleSheet.create({
  boton: {
    borderWidth: 1.5,
    borderColor: color.bordeFuerte,
    borderRadius: radio.md,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    backgroundColor: color.fondo,
  },
  botonTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: color.textoPrimario,
  },
  botonSubtexto: {
    fontSize: 13,
    color: color.textoTerciario,
    marginTop: 2,
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderColor: color.borde,
    borderRadius: radio.md,
    paddingVertical: espacio.md,
    paddingHorizontal: espacio.base,
    alignItems: 'center',
  },
  botonCancelarTexto: {
    fontSize: 14,
    color: color.textoTerciario,
    fontWeight: '600',
  },
});

const plantillaBoton = plantillaEstilos.boton;
const plantillaBotonTexto = plantillaEstilos.botonTexto;
const plantillaBotonSubtexto = plantillaEstilos.botonSubtexto;
const plantillaBotonCancelar = plantillaEstilos.botonCancelar;
const plantillaBotonCancelarTexto = plantillaEstilos.botonCancelarTexto;