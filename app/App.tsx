import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { crearIdea, eliminarIdea, listarIdeas, type Idea } from './db/ideas';
import { listarMetas, type Meta } from './db/metas';
import { convertirIdeaEnMeta } from './db/conversiones';
import {
  crearObjetivo,
  listarObjetivosPorMeta,
  type Objetivo,
} from './db/objetivos';

type Vista = 'ideas' | 'metas';

export default function App() {
  const [vista, setVista] = useState<Vista>('ideas');
  const [texto, setTexto] = useState('');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [textoObjetivo, setTextoObjetivo] = useState('');

  useEffect(() => {
    if (vista === 'ideas') {
      cargarIdeas();
    } else {
      cargarMetas();
    }
  }, [vista]);

  useEffect(() => {
    if (metaSeleccionada) {
      cargarObjetivos();
    }
  }, [metaSeleccionada]);

  async function cargarIdeas() {
    const lista = await listarIdeas();
    setIdeas(lista);
  }

  async function cargarMetas() {
    const lista = await listarMetas();
    setMetas(lista);
  }

  async function cargarObjetivos() {
    if (!metaSeleccionada) {
      return;
    }
    const lista = await listarObjetivosPorMeta(metaSeleccionada.id);
    setObjetivos(lista);
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

  async function guardarObjetivo() {
    const textoLimpio = textoObjetivo.trim();
    if (!textoLimpio || !metaSeleccionada) {
      return;
    }
    await crearObjetivo(metaSeleccionada.id, textoLimpio);
    setTextoObjetivo('');
    await cargarObjetivos();
  }

  async function convertir(idea: Idea) {
    await convertirIdeaEnMeta(idea);
    await cargarIdeas();
    await cargarMetas();
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
      <Text style={styles.titulo}>Flexgoal</Text>
      {metaSeleccionada ? (
        <>
          <Pressable
            style={styles.botonVolver}
            onPress={() => setMetaSeleccionada(null)}
          >
            <Text style={styles.botonVolverTexto}>← Volver</Text>
          </Pressable>
          <Text style={styles.subtitulo}>Metas: {metaSeleccionada.nombre}</Text>
          <TextInput
            style={styles.input}
            value={textoObjetivo}
            onChangeText={setTextoObjetivo}
            placeholder="Nuevo objetivo..."
            placeholderTextColor="#999"
            multiline
          />
          <Pressable style={styles.boton} onPress={guardarObjetivo}>
            <Text style={styles.botonTexto}>Agregar objetivo</Text>
          </Pressable>
          <FlatList
            data={objetivos}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemTexto}>{item.nombre}</Text>
                <Text style={styles.itemFecha}>
                  {new Date(item.creado_en).toLocaleString()}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.vacio}>
                Esta meta no tiene objetivos todavía. ¡Agrega el primero!
              </Text>
            }
          />
        </>
      ) : (
        <>
          <ViewToggle vista={vista} onChangeVista={setVista} />
          {vista === 'ideas' ? (
            <>
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
                    <View style={styles.itemContenido}>
                      <View style={styles.itemTextoWrapper}>
                        <Text style={styles.itemTexto}>{item.texto}</Text>
                        <Text style={styles.itemFecha}>
                          {new Date(item.creado_en).toLocaleString()}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.botonSecundario}
                        onPress={() => convertir(item)}
                      >
                        <Text style={styles.botonSecundarioTexto}>
                          Convertir en meta
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.vacio}>
                    Aún no tienes ideas guardadas. ¡Escribe la primera!
                  </Text>
                }
              />
            </>
          ) : (
            <FlatList
              data={metas}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => setMetaSeleccionada(item)}
                >
                  <Text style={styles.itemTexto}>{item.nombre}</Text>
                  <Text style={styles.itemFecha}>Estado: {item.estado}</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.vacio}>
                  Aún no tienes metas. Convierte una idea en meta para empezar.
                </Text>
              }
            />
          )}
        </>
      )}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function ViewToggle({
  vista,
  onChangeVista,
}: {
  vista: Vista;
  onChangeVista: (vista: Vista) => void;
}) {
  return (
    <View style={styles.tabs}>
      <Pressable
        style={[styles.tab, vista === 'ideas' && styles.tabActiva]}
        onPress={() => onChangeVista('ideas')}
      >
        <Text
          style={[
            styles.tabTexto,
            vista === 'ideas' && styles.tabTextoActivo,
          ]}
        >
          Ideas
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, vista === 'metas' && styles.tabActiva]}
        onPress={() => onChangeVista('metas')}
      >
        <Text
          style={[styles.tabTexto, vista === 'metas' && styles.tabTextoActivo]}
        >
          Metas
        </Text>
      </Pressable>
    </View>
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
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  botonVolver: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  botonVolverTexto: {
    fontSize: 16,
    color: '#1c7ed6',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  tabActiva: {
    backgroundColor: '#fff',
  },
  tabTexto: {
    fontSize: 15,
    color: '#666',
  },
  tabTextoActivo: {
    color: '#1c7ed6',
    fontWeight: '600',
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
  itemContenido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemTextoWrapper: {
    flex: 1,
  },
  itemTexto: {
    fontSize: 16,
  },
  itemFecha: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  botonSecundario: {
    backgroundColor: '#2b8a3e',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botonSecundarioTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  vacio: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 32,
  },
});